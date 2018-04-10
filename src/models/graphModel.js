'use strict';

var neo4j = require('neo4j-driver').v1;
var db = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "password"));


export default class Graph {
	constructor() {
	}
	static fetchGraph(callback) {

	}
	
	static doesTypeObjectExist(objectName, callback) {
		let session = db.session();
		let resultPromise = session.readTransaction(function(transaction) {
			let result = transaction.run('MATCH (n) RETURN DISTINCT LABELS (n)')
			return result;			
		});
		
		resultPromise.then(function(result) {
			session.close();
			let resultList = [];
			for (let i = 0; i < result.records.length; i++) {
				resultList.push(result.records[i]._fields[0][0])
			}
			
			if (resultList.indexOf(objectName) > -1) {
				callback(true, null);
			} else {
				callback(false, resultList);
			}
		}).catch(function(result) {
			session.close();
			console.log(result)
		});
	}

	static getRegexForEngagementType(type) {
		if (type == 'share') 
			return '.*\\\\[share author=.*'
		else if (type == 'assessment')
			return 'I am taking the \\\\[bookmark=.*'
		else if (type == 'stories')
			return 'Please read the story.*'
		else if (type == 'likes')
			return '.*\\\\[/url\\\\] likes \\\\[url.*'
		else
			return null
	}
	
	/* 
 	* endpoint for /graph/schema
	* @param callback (func) callback function
	* @format err,success
	* @return {labels: [" "], predicates: [{name: "", type: "literal"], objects: [" "]}
	*
	* {label: "ACCOUNT"
	* 	predicate: {id: "literal", date: "literal"} }
	*
	*
	* 1. Get all Labels
	* 2. For each label, list all properties
	* 3. For each label, list all relationships with Object
	* Formatting
	* {[{label: "PROFILE", predicates: [{prop:"literal"},...{rel:"label"}]},...]
	*
	*
	*/
	static describeGraph(callback) {
		let session = db.session()
		let resultPromise = session.readTransaction(function(transaction) {
			let result = transaction.run('CALL db.schema()')
			return result
		});
		
		resultPromise.then(function(result) {
			session.close()
			callback(null, result)
				
		}).catch(function(result) {
			session.close()
			callback("error: " + result, null)
		});	
	}

	static describeLabel(labelName, callback) {
		let session = db.session()
		let resultPromise = session.readTransaction(function(transaction) {
			let result = transaction.run('MATCH(a:' + labelName + ') RETURN keys(a) LIMIT 1')
			return result
		});
		
		resultPromise.then(function(result) {
			session.close()
			callback(null, result)
				
		}).catch(function(result) {
			session.close()
			callback("error: " + result, null)
		});
	}

	/*
 	* Find all the nodes of the given label name. If the node
 	* has a property matching the regex, return the node id.
 	* For each node id, return the following information '<node id>': 'propertyValue'
 	* Return as json
 	*/
	static findPropertyValue(labelName, propertySearch, engagementType, propertyValue, callback) {
		this.doesTypeObjectExist(labelName, function(bool, list) {
			if (bool) {
				let session = db.session();
				
				//Arrow function preserves 'this'
				let resultPromise = session.readTransaction((transaction) => {
					let regex = this.getRegexForEngagementType(engagementType);
					if (!regex) {
						return null;
					}
					let result = null
					//share engagement type has an error with the regex provided
					if (engagementType == "share") {
						result = transaction.run("MATCH (n:DIGITAL_OBJECT) WHERE n.body contains('[share author=') return ID(n)")	
					} else {
					//not allowed to parameterize labels... github.com/neo4j/neo4j/issues/2000 has been open since 2014
					//unsafe but only exposed to developers 
						result = transaction.run("MATCH (n:" + labelName + ") WHERE n."+ propertySearch +" =~ '"+ regex +"' RETURN ID(n)");
					}
					return result;
				});
				resultPromise.then(function(result) {
					//console.log(result)
					session.close();
					callback(null, result);
				}).catch(function(err) {
					session.close();
					callback(err, null);
				});	
			} else {
				callback("your property does not exist", null);	
			}	
		}.bind(this));
	}

	
	/*
 	* Create a new property for a node given the nodeIDs, propertyName and the propertyValue
 	* This function does not care what other properties are being stored (e.g. duplicated data might occur).
 	* This function will be done in commits to make sure we can rollback if necessary
 	 new params subject predicate object
	*/  	
	static createNewProperty(nodeID, propertyName, propertyValue, callback) {
		let session = db.session();
		let resultPromise = session.readTransaction((transaction) => {
			let result = transaction.run("MATCH (n) WHERE ID(n) = {id} SET n." + propertyName +" = {value}", {id: nodeID, value: propertyValue})
			return result
		})
		resultPromise.then(function(result) {
			session.close();
			callback(null, result);
		}).catch(function(err) {
			session.close();
			callback(err, null);
		})	
	}

	/*
 	* Create a new label in the graph
 	* Cannot create pre-existing label, so first check
 	*
 	*/
	static createNewLabel(labelName, callback) {
		this.doesTypeObjectExist(labelName, function(bool, list) {
			if (!bool) {
				let session = db.session()
				let resultPromise = session.readTransaction((transaction) => {
					let result = transaction.run("CREATE (n:" + labelName + ")");
					return result
				})
				resultPromise.then(function(result) {
					session.close()
					callback(null, result)
				}).catch(function(err) {
					session.close()
					callback(err)
				})
			} else {
				callback("error: label name already exists", null)
			}
		}) 	
	}

	/*
	* Run a raw query directly on Neo4j. This does not
	* do any validating of any kind. Use with caution.
	*
	*/
	static runRawQuery(query, callback) {
		let session = db.session()
		let resultPromise = session.readTransaction((transaction) => {
			return transaction.run(query)
		})
		resultPromise.then(function(result) {
			session.close()
			callback(null, result)
		}).catch(function(err) {
			session.close()
			callback(err)
		})
	}

	/*
 	* Create a new relationship between two groups of nodes
 	* LabelName 1 <-- relName --> LabelName 2
 	* RelationshipName: name of the relationship
 	* Options:
 	* 	Unidirectional, provide the originating node, default is bidirectional
 	* 	labelName1 match: match specific node(s) from label 1
 	* 	labelName2 match: match specific node(s) from label 2
 	*
 	* Cannot do bidirection anyways
 	* Options will just include the ids for the nodes, no options means match all nodes with the given label (potentially dangerous)
 	* MATCH (n:animal), (m:testing) WHERE ID(n) = ? AND ID(m) = ? CREATE (n)-[:WILL_BE]->(m)	
 	*/
	static createNewRelationship(labelName1, labelName2, relationshipName, options, callback) {
		this.doesTypeObjectExist(labelName1, (bool, list) => {
			if (bool) {
				this.doesTypeObjectExist(labelName2, (bool, list) => {
					if (bool) {
						let stmt = "MATCH (n:" + labelName1 + "), (m:" + labelName2 + ") "
						if (options) {
							if (options.match1) {
								stmt += "WHERE ID(n) = " + options.match1
								if (options.match2) {
									stmt += " AND ID(m) = " + options.match2
								}
							} else if (options.match2) {
								stmt += "WHERE ID(m) = " + options.match2
							}
						}
						stmt += " CREATE (n)-[:" + relationshipName + "]->(m)"	 
						console.log(stmt)
						let session = db.session()
						let resultPromise = session.readTransaction((transaction) => {
							let result = transaction.run(stmt);
							return result
						})
						resultPromise.then(function(result) {
							session.close()
							callback(null, result)
						}).catch(function(err) {
							session.close()
							callback(err, null)
						})
					
				
					} else {
						//throw error, label not found
					}
				})
			} else {
				//throw error, label not found
			}
		})
	}

	/*
 	* 1. Get all Node ids and associated type
 	* 2. Create new label (node) --> URI (associated with propertyValue)
 	* 3. MATCH (n id), (f: new label) --> create a link between n:[propertValue]->f
 	*/

	/**
 	* Add a predicate to the graph
 	* Call using the following way:
 	* addPredicate('PROFILE', 'name', {'uid': '1060'}, function(err,results){})
 	* @param labelName of the node in neo4j
 	* @param predicateName that user wants to add
 	* @param predicateValue that user wants to associate
 	* @param matchBy (object): match by an object - for example
 	* 	{'uid': '1060'}
 	* @param callback (function): get results
 	*/ 
	/*
	static addPredicate(labelName, predicateName, predicateValue, matchBy, callback) {
		if (!objectName || !predicateName || !matchBy) {
			callback("Error: Please enter the right params", null);
			return;
		}
		
		//callback hell starts here
		if (doesTypeObjectExist(labelName, function(bool, list) {
			if (bool) {
				//label exists
				//match by label
				let session = db.session();
				let resultPromise = session.readTransaction(function(transaction) {
					let result = transaction.run('MATCH (n: {labelNameParam} { {keyParam} : {matchByParam} }) SET n.{predicateNameParam} ', 
						{
										
	
						}
					);
				});
				resultPromise.then(function(result) {
					
				}).catch(function(result) {

				});
			} else {
				callback("Error: please pick correct label name. Possible choices include: " + JSON.stringify(list));
				return;
			}
		}) 
		let session = db.session();
		let resultPromise = session.readTransaction(function(transaction) {
							
		}	
	}
	*/

}
