'use strict';
import Comparative from "../models/comparativeModel"

/*
 *@David Brock
	This class defines does some processing after the query to hand off to the response
 */
exports.compareTwoGraphs = function (req, res) {
	Comparative.compareTwoGraphs(req.params.graphNAME1, req.params.graphNAME2, req.params.labelName, req.params.engagementTYPE,function(err, comparativeArray) {
	//	console.log(JSON.stringify(engagementArray['0']))
		console.log(Object.keys(comparativeArray).length)
		let listOfEngagementsGraphOne = [];
		let listOfEngagementsGraphTwo = [];
		//arbitrarily defines GraphOne as
		let graphOne = comparativeArray['0']._fields[0]
//		console.log(Object.keys(comparativeArray))
		console.log(comparativeArray['0'])
		for(let i = 0; i < (Object.keys(comparativeArray).length); i++) {

			let tempLabel = {}
			//Grab the data for person one and person two from the javascript
			tempLabel.network = comparativeArray[i.toString()]._fields[0]
			tempLabel.personOne = comparativeArray[i.toString()]._fields[1]
			tempLabel.personTwo = comparativeArray[i.toString()]._fields[2]
			tempLabel.engagementsBetween = comparativeArray[i.toString()]._fields[3]["low"]
			//put the object that data is stored into our list
			if(graphOne == tempLabel.network)
			{		
				listOfEngagementsGraphOne.push(tempLabel)		
			}
			else
			{
				listOfEngagementsGraphTwo.push(tempLabel)
			}
		}

		//Currently a,b count =! b,a count Need to sum up interactions in a bidirectional way
		let resultListpart1 = listOfEngagementsGraphOne
		let resultListpart2 = listOfEngagementsGraphTwo
		for(let i = 0; i < listOfEngagementsGraphOne.length; i++)
		{
		
				for(let j = i+1; j < listOfEngagementsGraphOne.length; j++)
				{
				if(listOfEngagementsGraphOne[j] && listOfEngagementsGraphOne[i].personOne == listOfEngagementsGraphOne[j].personTwo && listOfEngagementsGraphOne[i].personTwo == listOfEngagementsGraphOne[j].personOne)
				{		
				
				resultListpart1[i].engagementsBetween += listOfEngagementsGraphOne[j].engagementsBetween
				remove(resultListpart1, listOfEngagementsGraphOne[j]);
				}
				}
			
		}
		for(let i = 0; i < listOfEngagementsGraphTwo.length; i++)
		{
		
				for(let j = i+1; j < listOfEngagementsGraphTwo.length; j++)
				{
				if(listOfEngagementsGraphTwo[j] && listOfEngagementsGraphTwo[i].personOne == listOfEngagementsGraphTwo[j].personTwo && listOfEngagementsGraphTwo[i].personTwo == listOfEngagementsGraphTwo[j].personOne)
				{		
				
				resultListpart2[i].engagementsBetween += listOfEngagementsGraphTwo[j].engagementsBetween
				remove(resultListpart2, listOfEngagementsGraphTwo[j]);
				}
				}
		
		}
		
		comparativeArray = resultListpart1.concat(resultListpart2)
		

		res.send(JSON.stringify(comparativeArray));

	});	
}
//removes an element and reformats an array
function remove(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
    array.splice(index, 1);
    }
}
