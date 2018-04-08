'use strict';
//var graph = require("../models/graphModel");
import Graph from "../models/graphModel"

exports.fetchGraph = function(req, res) {
	Graph.fetchGraph(function(err, graphArray) {
		res.send(JSON.stringify(graphArray));
	});
}

exports.findPropertyValue = function(req, res) {
	
	Graph.findPropertyValue(req.query.labelName, req.query.propertyName, req.query.engagementType, req.query.propertyValue, function(err, result) {
		res.send(result);
	});
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

