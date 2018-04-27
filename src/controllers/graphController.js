'use strict';

import Graph from "../models/graphModel"
var logger = require("./logController.js")
var errorMessage = require("../errors.js")
const csv = require('csvtojson')
const json2csv = require('json2csv').Parser
const fs = require('fs')
const path = require('path')
const {spawn} = require('child_process')
const exec = require('child_process').exec
const queryType = 'graph'


/*
 * Data follows same format
 * We assume data is first an array
 * each element is a 'node' or node-pair
 * check if [i]._fields[0].segments exists
 * if it does:
 * 	segments.start.identity.low (id for first node)
 * 	segments.start.labels[0] (label for node)
 * 	segment.start.properties (props for node)
 * 	
 * 	[replace 'start' with 'end' for the second node]
 * 	segment.end...
 *
 * 	segments.relationship.start.low (source)
 * 	segments.relationship.end.low (target)
 * 	segments.relationship.type (caption)
 *
 * Format for D3:
 * let obj = {
 * 	comment: 'rand message',
 * 	nodes: [{
 * 		id: low
 * 		caption: mixed
 * 		properties: properties
 * 		role: label
 * 		}, {..},..],
 * 	edges: [{
 * 		source: low
 * 		target: low
 * 		caption: type
 * 		},{..},..]
 * }
 *
 * res.send(obj)
 * 
 */
var neo4jToD3 = function(data) {
	let obj = {
		nodes: [],
		edges: []
	}
	for (let i = 0; i < data.records.length; i++) {
		let segments = data.records[i]._fields[0].segments[0]
		if (segments) {

			let node1 = {}
			let node2 = {}
			let edge = {}
			
			node1.id = segments.start.identity.low
			node1.caption = node1.id
			node1.role = segments.start.labels[0]			
			
			node2.id = segments.end.identity.low
			node2.caption = node2.id
			node2.role = segments.end.labels[0]
			
			edge.source = segments.relationship.start.low
			edge.target = segments.relationship.end.low
			edge.caption = segments.relationship.type		
			
			if (shouldInsert(node1.id, obj.nodes)) {
				obj.nodes.push(node1)
			}
			
			if (shouldInsert(node2.id, obj.nodes)) {
				obj.nodes.push(node2)
			}
			obj.edges.push(edge)
		}
	}
	return obj
}

var neo4jSchemaToD3 = function(data) {
	let obj = {
		nodes: [],
		edges: []
	}
	for (let i = 0; i < data.records[0]._fields[0].length; i++) {
		let segments = data.records[0]._fields[0][i]
		if (segments) {

			let node1 = {}
		
			node1.id = segments.identity.low
			node1.caption = node1.id
			node1.role = segments.labels[0]			
			
			obj.nodes.push(node1)	
			
		}
	}
	for (let i = 0; i < data.records[0]._fields[1].length; i++) {
		let edge = data.records[0]._fields[1][i]
		if (edge) {
			let edgeObj = {}
			
			edgeObj.source = edge.start.low
			edgeObj.target = edge.end.low
			edgeObj.caption = edge.type	
			
			obj.edges.push(edgeObj)
		}
	}
	return obj
}



var shouldInsert = function(id, nodeArray) {
	for (let i = 0; i < nodeArray.length; i++) {
		if (nodeArray[i].id == id) {
			return false
		}
	}
	return true
}

/*
 * Fetch all the nodes in a specific graph or all graphs
 *
 */
exports.fetchGraph = function(req, res) {	
	let log = {
		queryType: queryType,
		developerAPI: false,
		didModifyGraph: false,
		request: req.query,
		timestamp: new Date().getTime()	
	}
	let isDisplay = req.query.isDisplay ? req.query.isDisplay : false
	Graph.fetchGraph(req.query.graphName, isDisplay, (err, graphArray) => {
		if (err) {
			logger.writeErrorLog(log, err)
			res.send(err)
		} else {
			if (isDisplay) {
				res.send(neo4jToD3(graphArray))
			} else {
				log.cypher = graphArray
				logger.writeLog(log)
				if (graphArray) {
					let nodes = []
					for (let i = 0; i < graphArray.records.length; i++) {
						let tempObj = {}
						tempObj.nodeID = graphArray.records[i]._fields[0].identity.low
						tempObj.label = graphArray.records[i]._fields[0].labels
						tempObj.properties = graphArray.records[i]._fields[0].properties
						nodes.push(tempObj)
					}
					res.send(nodes)
				} else {
					res.send(errorMessage.noResults)
				}
			}
		}
			
	})
}

exports.fetchNode = function(req, res) {
	let log = {
		queryType: queryType,
		developerAPI: false,
		didModifyGraph: false,
		request: req.query,
		timestamp: new Date().getTime()	
	}
	if (!req.query.nodeID) {
		logger.writeErrorLog(log, errorMessage.missingParameter)
		res.send(errorMessage.missingParameter)
		return					
	}
	Graph.fetchNode(req.query.nodeID, function(err, data) {
		if (err) {
			logger.writeErrorLog(log, err)
			res.send(err)
		} else {
			log.cypher = data
			logger.writeLog(log)
			if (data) {
				res.send(data)
			} else {
				res.send(errorMessage.noResults)
			}
		}
	})	
}


/**
 * This will find any node based on any part that 'CONTAINS' something
 * Required: labelName (string)
 * Optional: contains (string)
 * Optional: not (boolean)
 * This function does not allow multiple 'contains'
 * This function is cross networks
 * If the 'contains' is not filled in, everything with the label will be grabbed
 * @return: list of node ids that match the search parameters
 */
exports.findNode = function(req, res) {
	
	let log = {
		queryType: queryType,
		developerAPI: false,
		didModifyGraph: false,
		request: req.body,
		timestamp: new Date().getTime()	
	}
	if (!req.body.labelName) {
		res.send(errorMessage.missingParameter)
		logger.writeErrorLog(log, errorMessage.missingParamter)	
	}
	else {
		Graph.findAnyNode(req.body, function(err, result) {
			if (err) {
				res.send(err)
				logger.writeErrorLog(log, err)		
			} else if (result) {
				/**
 				* Data coming from Neo4j has a peculiar structure
 				* Everything is stored in an array called 'records', which is a field
 				* So first we get the records 'result.records'
 				* For each value of the array, we have a few field that are noteworthy
 				* The _fields is a field within each object within the array that contains
 				* information about the data in question as well as other information
 				* For the case of extracting IDs, we want the 'low' of the first element of the ._fields array
 				* So we look for the ._fields[0].low to get the node ids (for this particular case)
 				*/
				let records = result.records
				let fields = ["nodeID"]
				let nodes = []
				for (let i = 0; i < records.length; i++) {
					let temp = {}
					temp["nodeID"] = records[i]._fields[0].low
					nodes.push(temp) 
				}
				const json2csvParser = new json2csv({fields})
				const csv = json2csvParser.parse(nodes)
				let randFileName = ""
				let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
				for (var i = 0; i < 10; i++)
					randFileName += alpha.charAt(Math.floor(Math.random() * alpha.length))
				fs.writeFile(randFileName + ".csv", csv, function(err) {
					log.cypher = result
					if (err) {
						res.send(csv)
						logger.writeErrorLog(log, err) 	
					} else {
						let absPath = path.join(__dirname, '../../' + randFileName + '.csv')
						res.sendFile(absPath, {}, function(err) {
							//delete temp file once send is complete
							fs.unlink(absPath, function(err) {
								if (err) {
									console.log(err)
								}
							})	
						})
						logger.writeLog(log)
					}
				})
			} else {
				log.cypher = result
				logger.writeLog(log)
				res.send(errorMessage.noResult)
			}
		})	
	}	
}

/*
 * This only finds properties on a Digital Object
 * This is more like a helper function and should be
 * invoked in the code or when a user is specificially searching
 * for something within the DIGITAL_OBJECT object
 */
exports.findPropertyValue = function(req, res) {		
	let log = {
		queryType: queryType,
		developerAPI: false,
		didModifyGraph: false,
		request: req.query,
		timestamp: new Date().getTime()	
	}
	Graph.findPropertyValue(req.query.propertyName, req.query.engagementType, function(err, result) {
		if (err) {
			logger.writeErrorLog(log, err)
			res.send(err)
		} else if (results) {
			let records = result.records
			let fields = ["nodeID"]
			let nodes = []
			for (let i = 0; i < records.length; i++) {
				let temp = {}
				temp["nodeID"] = records[i]._fields[0].low
				nodes.push(temp) 
			}

			const json2csvParser = new json2csv({fields})
			const csv = json2csvParser.parse(nodes)	
			let randFileName = ""
			let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
			for (var i = 0; i < 10; i++)
				randFileName += alpha.charAt(Math.floor(Math.random() * alpha.length))
			fs.writeFile(randFileName + ".csv", csv, function(err) {
				log.cypher = result
				if (err) {
					logger.writeErrorLog(log, err)
					res.send(csv)
				} else {
					let absPath = path.join(__dirname, '../../' + randFileName + '.csv')
					res.sendFile(absPath, {}, function(err) {
						//delete temp file once send is complete
						fs.unlink(absPath, function(err) {
							if (err) {
								console.log(err)
							}
						})	
					})
					logger.writeLog(log)
				}
			})
			
		} else {
			log.cypher = result
			logger.writeLog(log)
			res.send(errorMessage.noResult)
		}
	})
}

/**
 * Create a new label
 * This requires the labelName to be unique
 *
 */
exports.createNewLabel = function(req, res) {	
	let log = {
		queryType: queryType,
		developerAPI: true,
		didModifyGraph: true,
		request: req.query,
		timestamp: new Date().getTime()	
	}
	if (!req.query.labelName) {
		logger.writeErrorLog(log, errorMessage.missingParameter)
		res.send(errorMessage.missingParameter)
		return 
	}
	Graph.createNewLabel(req.query.labelName, function(err, result) {
		log.cypher = result
		if (err) {
			logger.writeErrorLog(log, err)	
			res.send(err)
		} else {	
			res.send(result)
			logger.writeLog(log)
		}
	})
}

/**
 * Create new property for a pre-existing node
 * This adds a literal predicate to an object
 *
 */
exports.createNewProperty = function(req, res) {
	let log = {
		queryType: queryType,
		developerAPI: true,
		didModifyGraph: true,
		request: req.body,
		timestamp: new Date().getTime()	
	}
	if (!req.body.nodeIDs || !req.body.propertyName || !req.body.propertyValue) {
		logger.writeErrorLog(log, errorMessage.missingParamter)
		res.send(errorMessage.missingParamter)
		return		
	}
	let nodeIDs = req.body.nodeIDs
	let propertyName = req.body.propertyName
	let propertyValue = req.body.propertyValue
	for (let i = 0; i < nodeIDs.length; i++) {
		Graph.createNewProperty(nodeIDs[i], propertyName, propertyValue, function(err, result) {
			log.cypher = result
			if (err) {
				logger.writeErrorLog(log, err)
				res.send(err)
				return
			}
			if (i == (nodeIDs.length - 1)) {
				logger.writeLog(log)
				res.send(result)
			}
		})
	}
}

/**
 * Create new relationship between one-to-one or many-to-one node ids
 * We can accept either a JSON object for one-to-one queries
 * Or we can accept a CSV upload in a given format for bulk relationship creating
 * Format for CSV is as follows:
 * Headers:	label1, label2, match1, match2, relationshipName
 * Data:	PROFILE, MALE,  <nodeID>, OPTIONAL, IS_A
 * Data: 	BLANK,   BLANK	<nodeID>, BLANK,    IS_A
 *
 * Where:
 * OPTIONAL = optional field
 * BLANK = required to be blank/will be ignored
 * <nodeID> = id of the node
 *
 */
exports.createNewRelationship = function(req, res) {
	let log = {
		queryType: queryType,
		developerAPI: true,
		didModifyGraph: true,
		request: {body: req.boy, files: req.files},
		timestamp: new Date().getTime()	
	}
	if (req.files.csvImport) {	
		let csvFilePath =  req.files.csvImport.file
		let lineNum = 0
		let queries = []
		let label1 = ""
		let label2 = ""
		let relationshipName = ""
		csv().fromFile(csvFilePath).on('json',(obj)=> {
			/*
 			* IMPORT DATA FROM CSV
 			* FIRST LINE HAVE THE HEADERS
 			* SECOND LINE ONWARDS HAVE DATA
 			* THIS INNER FUNCTION WILL BE CALLED FOR N LINES
 			*/
			if (lineNum == 0) {
				if (!obj.label1 || !obj.label2 || !obj.relationshipName) {
					logger.writeErrorLog(log, errorMessage.missingParamter)
					res.send(errorMessage.missingParamter)
				}
				label1 = obj.label1
				label2 = obj.label2
				relationshipName = obj.relationshipName	
			}
				
			let query = "MATCH (n:" + label1 + "), (m:" + label2 + ") WHERE ID(n) = " + obj.match1
			query += obj.match2 != '' ? " AND ID(m) = " + obj.match2 : ""
			query += " CREATE (n)-[:" + relationshipName + "]->(m)"
			queries.push(query)
			//DO NOT RUN ASYNC QUERY HERE.	
			lineNum++
			
		}).on('done', (error)=> {
			fs.unlink(csvFilePath, function(err) {
				if (err) {
					console.log(err)
				}
			})
			if (error) {
				logger.writeErrorLog(log, error)
				res.send(error)
			}
			else {
				for (let i = 0; i < queries.length; i++) {
					bulkString += queries[i] + ";"
				}
				let randFileName = ""
				let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
				for (var i = 0; i < 10; i++)
					randFileName += alpha.charAt(Math.floor(Math.random() * alpha.length))	
				let absPath = path.join(__dirname, '../../' + randFileName + '.txt')
				fs.writeFile(absPath, bulkString, function(err) {
					exec('cypher-shell -u neo4j -p password --format plain < ' + absPath, function(error, stdout, stderr) {
						if (error) {
							logger.writeErrorLog(log, error)	
						} else {
							logger.writeLog(log)
						}
						fs.unlink(absPath, function(err) {
							if (err) {
								console.log(err)
							} else {
								res.send(true)
							}
						})
					})	
				})	
			}
		})	
	} else {
		if (!req.body.labelName1 || !req.body.labelName2 || !req.body.relationshipName) {
			logger.writeErrorLog(log, errorMessage.missingParamter)
			res.send(errorMessage.missingParamter)
			return
		}
		Graph.createNewRelationship(req.body.labelName1, req.body.labelName2, req.body.relationshipName, req.body.options, function(err, result) {
			if (err) {
				res.send(err)
				log.cypher = result
				logger.writeErrorLog(log, err)
			}
			else {
				res.send(true)
				logger.writeLog(log)
			}
		})
	}
}

/*
 * Fetches the entire schema and displays information in a JSON
 * This also descibes the data in a Subject, Object, Predicate format
 * This also specifies whcih predicates have literals instead of objects
 */	
exports.fetchSchema = function(req, res) {
	let log = {
		queryType: queryType,
		developerAPI: true,
		req: {request: "fetchSchema"},
		didModifyGraph: true,
		timestamp: new Date().getTime()	
	}
	Graph.describeGraph(function(err, result) {
		if (req.query.isDisplay) {
			res.send(neo4jSchemaToD3(result))
			return
		} 
		/**
 		* Do data processing here	
 		*/	
		let labelList = [];
		if (!result) {
			logger.writeErrorLog(log, err)
			res.send(err)
		}
		for (let i = 0; i < result.records[0]._fields[0].length; i++) {
			let tempLabel = {}
			tempLabel.name = result.records[0]._fields[0][i].properties.name
			tempLabel.id = result.records[0]._fields[0][i].identity.low * -1 //-1 --> 1
			labelList.push(tempLabel)
			//label names
		}
		//relationships match ids for labels, so for example 
		//	label id 0 --> TO --> label id 1
		//	label id 1 --> SELF --> label id 1
		//so now that we have all the labels and their ids
		//sort array based on label id
		//_fields[1][j] contains all the relationships. We will match via array index	

		//relationships
		//store like this: labelName.predicate = {name: RELATIONSHIP_NAME, type: OBJECT} 	
		let resultList = [];
		for (let i = 0; i < labelList.length; i++) {
			let temp = {}
			temp.objectName = labelList[i].name
			temp.predicates = []	
			let relationships = result.records[0]._fields[1]
			Graph.describeLabel(labelList[i].name, function(err, result) {
				if (err && !result) {
					//if the inner callback fails in the model, skip that label, continue to the next
					logger.writeErrorLog(log, err)	
					res.send(err)
					return; //prevent sending multiple headers
				}
				else {
					for (let j = 0; j < result.props.records[0]._fields[0].length; j++) {
						let tempPred = {}
						tempPred.name = result.props.records[0]._fields[0][j]
						tempPred.type = 'literal'
						temp.predicates.push(tempPred)
					}
					for (let j = 0; j < result.rels.records.length; j++) {
						if (result.rels.records[j]) {
							let tempRel = {}
							tempRel.name = result.rels.records[j]._fields[0][0]
							tempRel.type = result.rels.records[j]._fields[1]
							temp.predicates.push(tempRel)
						}
						//fields[0][0] is the obj
						//fields[1] is the type
					}
					resultList.push(temp)	
				}
				//only send the request if you are on the last iteration of the outer-loop
				if (i == labelList.length - 1) {
					logger.writeLog(log)
					res.send(resultList)
				}
			})		
		}
	})		
}

