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
		/*	console.log(engagementArray)
			let listOfEngagements = [];
			for(let i = 0; i < engagementArray.length; i++) {
				let tempLabel = {}
				//Grab the data for person one and person two from the javascript
				tempLabel.personOne = engagementArray[i.toString()]._fields[0]
				tempLabel.personTwo = engagementArray[i.toString()]._fields[1]
				tempLabel.engagementsBetween = engagementArray[i.toString()]._fields[2]["low"]
				//put the object that data is stored into our list
				listOfEngagements.push(tempLabel)		
			}
			//Currently a,b count =! b,a count Need to sum up interactions in a bidirectional way
			let resultList = listOfEngagements
			for(let i = 0; i < engagementArray.length; i++) {
			
				for(let j = i+1; j < engagementArray.length; j++) {
					if (listOfEngagements[j] && listOfEngagements[i].personOne == listOfEngagements[j].personTwo && 
					listOfEngagements[i].personTwo == listOfEngagements[j].personOne) {		
						resultList[i].engagementsBetween += listOfEngagements[j].engagementsBetween
						remove(resultList, listOfEngagements[j]);
					}
				}
		*///	}
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


