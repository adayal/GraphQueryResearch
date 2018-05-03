'use strict';
import Comparative from "../models/comparativeModel"
var errorMessage = require("../errors.js")
var logger = require("./logController.js")
const queryType = 'graph' //searches graph

/*
 *@David Brock
	This class defines does some processing after the query to hand off to the response
 */
exports.compareTwoGraphs = function (req, res) {
	let log = {
		queryType: queryType,
		developerAPI: false,
		didModifyGraph: false,
		request: req.params,
		timestamp: new Date().getTime()	
	}
	let params = req.params
	if (!params.graphName1 || !params.graphName2 || !params.labelName || !params.engagementType) {
		res.send(errorMessage.missingParameter)
		logger.writeErrorLog(log, errorMessage.missingParamter)
		return
	}
	Comparative.compareTwoGraphs(params.graphName1, params.graphName2, params.labelName, params.engagementType, function(err, comparativeArray) {
		if (err) {
			logger.writeErrorLog(log, err)
			res.send(errorMessage.neo4jError)
		} else if (!comparativeArray || comparativeArray.length == 0) {
			log.cypher = comparativeArray
			logger.writeErrorLog(log, errorMessage.noResults)
			res.send(errorMessage.noResults)
		} else {
			log.cypher = comparativeArray
			logger.writeLog(log)
			res.send(comparativeArray)
		}
	});	
}

//removes an element and reformats an array
function remove(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
    	array.splice(index, 1);
    }
}
