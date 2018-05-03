'use strict';
import Engagement from "../models/engagementModel"
var errorMessage = require("../errors.js")
var logger = require("./logController.js")
const queryType = 'graph'


/*
 *@David Brock
	This class defines does some processing after the query to hand off to the response
 */
exports.fetchEngagementDetails = function (req, res) {
	let log = {
		queryType: queryType,
		developerAPI: false,
		didModifyGraph: false,
		request: req.params,
		timestamp: new Date().getTime()	
	}
	let params = req.params
	if (!params.graphName || !params.engagementType) {
		res.send(errorMessage.missingParameter)
		return
	}
	Engagement.fetchEngagementDetails(params.graphName, params.engagementType, function(err, engagementArray) {	
		if (err) {
			logger.writeErrorLog(log, err)
			res.send(errorMessage.neo4jError)
		} else if (!engagementArray || engagementArray.length == 0) {
			log.cypher = engagementArray
			logger.writeErrorLog(log, errorMessage.noResults)
			res.send(errorMessage.noResults)
		} else {
			log.cypher = engagementArray
			logger.writeLog(log)
			res.send(engagementArray)
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
