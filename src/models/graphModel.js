'use strict';

var config = require("../../config.js")
var neo4j = require('neo4j-driver').v1;
var db = neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password));
var errorMessages = require("../errors.js")

export default class Graph {
	
	static fetchGraph(graphName, callback) {
		let session = db.session()
		let resultPromise = session.readTransaction(function(transaction) {
			let query = graphName ? "MATCH (n), (m:NETWORK{name:'"+graphName+"'}) WHERE (n)-[:PART_OF]->(m) RETURN n" : "MATCH (n) RETURN (n)"
			return transaction.run(query)
		})
		
		resultPromise.then(function(result) {
			session.close()
			callback(null, result)	
		}).catch(function(err) {
			session.close()
			callback(errorMessages.neo4jError + err, null)
		})
	}

	static fetchNode(nodeID, callback) {
		let session = db.session()
		let resultPromise = session.readTransaction(function(transaction) {
			let query = "MATCH (n) WHERE ID(n) = " + nodeID
			return transaction.run(query)
		})
		
		resultPromise.then(function(result) {
			session.close()
			callback(null, result)	
		}).catch(function(err) {
			session.close()
			callback(errorMessages.neo4jError + err, null)
		})
	}
	
	/*
 	* Check if a label exists in the graph
 	* This function is dynamic for the data and any new labels created
 	* Ths function returns data in a callback in the following format:
 	* boolean = true if exists, false otherwise
 	* list = list of labels, if and only if boolean is false
 	*/
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
		});
	}

	/**
	* Data store for regex for each engagement type
	*/
	static getRegexForEngagementType(type) {
		if (type == 'share') 
			return '.*\\\\[share author=.*'
		else if (type == 'assessment')
			return 'I am taking the \\\\[bookmark=.*'
		else if (type == 'stories')
			return 'Please read the story.*'
		else if (type == 'likes')
			return '.*\\\\[/url\\\\] likes \\\\[url.*'
		else if (type == 'post')
			return true
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
			callback(errorMessages.neo4jError + result, null)
		});	
	}

	/*
 	* This function is used get all the properties of a label
 	* @TODO check if label actually exists before running
 	*/
	static describeLabel(labelName, callback) {
		let session = db.session()
		let resultPromise = session.readTransaction(function(transaction) {
			let result = transaction.run('MATCH(a:' + labelName + ') RETURN keys(a) LIMIT 1')
			return result
		});
		
		resultPromise.then(function(result) {
			session.close()
			this.describeLabelRelationships(labelName, function (err, relationships) {
				if (err) {
					callback(err, result)
				} else {
					let labelObj = {}
					labelObj.props = result
					labelObj.rels = relationships
					callback(null, labelObj)		
				}
			})
				
		}.bind(this)).catch(function(result) {
			session.close()
			callback(errorMessages.neo4jError + result, null)
		});
	}

	static describeLabelRelationships(labelName, callback) {
		let session = db.session()
		let resultPromise = session.readTransaction(function(transaction) {
			let result = transaction.run('MATCH (n:'+ labelName + ')<-[r]->(m) return distinct labels(m), TYPE(r)')
			return result
		})
		resultPromise.then(function(result) {
			session.close()
			callback(null, result)
		}).catch(function(err) {
			session.close()
			callback(errorMessages.neo4jError + result, null)
		})
	}

	/*
 	* This function will find any node that contains a string given the label
 	* and will return the id of that node
 	* This function takes in an object of parameters and a callback function
 	* @param body from the req
 	* @param callback (func) to pass back results
 	*/
	static findAnyNode(body, callback) {
		this.doesTypeObjectExist(body.labelName, function(bool, list) {
			if (bool) {
				let session = db.session()
				let stmt = "MATCH (m:" + body.labelName + ") "
				if (body.contains && body.propertyName) {
					if (body.not) {
						stmt += "WHERE NOT toUpper(m." + body.propertyName.toLowerCase() + ") CONTAINS('" + body.contains.toUpperCase() + "') RETURN ID(m)"	
					} else {
						stmt += "WHERE toUpper(m." + body.propertyName.toLowerCase() + ") CONTAINS('" + body.contains.toUpperCase() + "') RETURN ID(m)"	
					}
				}
				else if (body.contains && !body.propertyName) {
					if (body.not) {
						stmt += "WHERE (none(prop in keys(m) where toUpper(toString(m[prop])) CONTAINS('" + body.contains.toUpperCase() + "'))) RETURN ID(m)"
					} else {
						stmt += "WHERE (any(prop in keys(m) where toUpper(toString(m[prop])) CONTAINS('" + body.contains.toUpperCase() + "'))) RETURN ID(m)"
					}
				} else {
					stmt += "RETURN ID(m)"
				
				}
				let resultPromise = session.readTransaction(function(transaction) {
					return transaction.run(stmt)
				})
				resultPromise.then(function(result) {
					session.close()
					callback(null, result)
				}).catch(function(result) {
					session.close()
					callback(errorMessages.neo4jError + result, null)
				})
			} else {
				callback(errorMessages.unkownLabel + list, null)
			}
		})
	}


	/*
 	* Find all the nodes of the given label name. If the node
 	* has a property matching the regex, return the node id.
 	* For each node id, return the following information '<node id>': 'propertyValue'
 	* Return as json
 	*/
	static findPropertyValue(propertySearch, engagementType, callback) {
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
			} else if (engagementType == "post") {
				result = transaction.run("MATCH (n:DIGITAL_OBJECT) WHERE NOT n.body CONTAINS('[share author=') AND NOT n.body CONTAINS('[/url] likes [url=') AND NOT n.body CONTAINS('Please read the story [bookmark=') AND NOT n.body CONTAINS('I am taking the [bookmark=') return ID(n)")
			} else {
			//not allowed to parameterize labels... github.com/neo4j/neo4j/issues/2000 has been open since 2014
			//unsafe but only exposed to developers 
				result = transaction.run("MATCH (n:DIGITAL_OBJECT) WHERE n."+ propertySearch +" =~ '"+ regex +"' RETURN ID(n)");
			}
			return result;
		});
		resultPromise.then(function(result) {
			session.close();
			callback(null, result);
		}).catch(function(err) {
			session.close();
			callback(errorMessages.neo4jError + err, null);
		});		
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
			callback(errorMessages.neo4jError + err, null);
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
					callback(errorMessages.neo4jError + err, null)
				})
			} else {
				callback(errorMessages.existsLabel , null)
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
			callback(errorMessages.neo4jError + err , null)
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
							callback(errorMessages.neo4jError + err, null)
						})	
					} else {
						callback(errorMessages.unknownLabel + list, null)	
					}
				})
			} else {	
				callback(errorMessages.unknownLabel + list, null)	
			}
		})
	}
}
