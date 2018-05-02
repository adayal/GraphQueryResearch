'use strict';
import Comparative from "../models/comparativeModel"
var errorMessage = require("../errors.js")

/*
 *@David Brock
	This class defines does some processing after the query to hand off to the response
 */
exports.compareTwoGraphs = function (req, res) {
	let params = req.params
	if (!params.graphName1 || !params.graphName2 || !params.labelName || !params.engagementType) {
		res.send(errorMessage.missingParameter)
		return
	}
	Comparative.compareTwoGraphs(params.graphName1, params.graphName2, params.labelName, params.engagementType, function(err, comparativeArray) {
		if (err) {
			res.send(errorMessage.neo4jError)
		} else if (!comparativeArray) {
			res.send(errorMessage.noResults)
		} else {
			res.send(comparativeArray);
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
