'use strict';
import Engagement from "../models/engagementModel"
var errorMessage = require("../errors.js")

/*
 *@David Brock
	This class defines does some processing after the query to hand off to the response
 */
exports.fetchEngagementDetails = function (req, res) {
	let params = req.params
	if (!params.graphNAME || !params.engagementTYPE) {
		res.send(errorMessage.missingParameter)
		return
	}
	Engagement.fetchEngagementDetails(params.graphNAME, params.engagementTYPE, function(err, engagementArray) {	
		if (err) {
			console.log(err)
			res.send(errorMessage.neo4jError)
		} else if (!engagementArray) {
			res.send(errorMessage.noResults)
		} else {
			res.send(engagementArray);
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


