'use strict';

import Graph from "../models/graphModel"
const csv = require('csvtojson')
const json2csv = require('json2csv').Parser
const fs = require('fs')
const path = require('path')
const {spawn} = require('child_process')
const exec = require('child_process').exec

exports.fetchGraph = function(req, res) {
	Graph.fetchGraph(function(err, graphArray) {
		res.send(JSON.stringify(graphArray));
	});
}

exports.findPropertyValue = function(req, res) {
	
	Graph.findPropertyValue(req.query.labelName, req.query.propertyName, req.query.engagementType, req.query.propertyValue, function(err, result) {
		if (err) {
			console.log(err)
			res.send(err)
		} else {
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
				if (err) {
					console.log(err)
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
				}
			})
			
		}
	});
}

exports.createNewLabel = function(req, res) {
	Graph.createNewLabel(req.query.labelName, function(err, result) {
		if (err) {
			console.log(err)
			res.send(err)
		} else {	
			res.send(result)
		}
	})
}

exports.createNewProperty = function(req, res) {
	let nodeIDs = req.body.nodeIDs
	let propertyName = req.body.propertyName
	let propertyValue = req.body.propertyValue
	for (let i = 0; i < nodeIDs.length; i++) {
		Graph.createNewProperty(nodeIDs[i], propertyName, propertyValue, function(err, result) {
			if (err) {
				console.log(err)
				res.send(err)
				return
			}
			if (i == (nodeIDs.length - 1)) {
				console.log(result)
				res.send(result)
			}
		})
	}
}

exports.createNewRelationship = function(req, res) {
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
			if (error)
				res.send(error)
			else {
				let isSent = false
				let bulkString = ""
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
						console.log(error)
						console.log(stdout)
						console.log(stderr)	
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
		Graph.createNewRelationship(req.body.labelName1, req.body.labelName2, req.body.relationshipName, req.body.options, function(err, result) {
			if (err)
				res.send(err)
			else
				res.send(true)
		})
	}
}

	
exports.fetchSchema = function(req, res) {
	Graph.describeGraph(function(err, result) {
		/**
 		* Do data processing here	
 		*/	
		let labelList = [];
		if (!result)
			res.send(err)
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
				if (err) {
					res.send(err)
				}
				else {
					for (let j = 0; j < result.records[0]._fields[0].length; j++) {
						let tempPred = {}
						tempPred.name = result.records[0]._fields[0][j]
						tempPred.type = 'literal'
						temp.predicates.push(tempPred)
					}
					
					for (let j = 0; j < relationships.length; j++) {
						if ((relationships[j].start.low * -1) == labelList[i].id) {
							let relationship = {}
							relationship.name = relationships[j].type
							for (let k = 0; k < labelList.length; k++) {	
								if (labelList[k].id == (relationships[j].end.low * -1)) {
									relationship.type = labelList[k].name
								}		
							}
							temp.predicates.push(relationship)
						}
					}
					resultList.push(temp)	
				}
				//only send the request if you are on the last iteration of the outer-loop
				if (i == labelList.length - 1) {
					res.send(resultList)
				}
			})		
		}
	})		
}

