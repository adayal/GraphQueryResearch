'use strict';
import Engagement from "../models/engagementModel"

/*
 *@David Brock
	This class defines does some processing after the query to hand off to the response
 */
exports.fetchEngagementDetails = function (req, res) {
	Engagement.fetchEngagementDetails(req.params.graphNAME, req.params.engagementTYPE,function(err, engagementArray) {
		//Object.keys(engagementArray) returns keys 0 through 709 for likes, which corresponds to each row.
	//	console.log(JSON.stringify(engagementArray['0']))
		
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
		for(let i = 0; i < engagementArray.length; i++)
		{
		
				for(let j = i+1; j < engagementArray.length; j++)
				{
				if(listOfEngagements[j] && listOfEngagements[i].personOne == listOfEngagements[j].personTwo && listOfEngagements[i].personTwo == listOfEngagements[j].personOne)
				{		
				
				resultList[i].engagementsBetween += listOfEngagements[j].engagementsBetween
				remove(resultList, listOfEngagements[j]);
				}
				}
			
		}
		//console.log(resultList)
		res.send(JSON.stringify(resultList));
	
	});	
}
//removes an element and reformats an array
function remove(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
    array.splice(index, 1);
    }
}


