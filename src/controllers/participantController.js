'use strict';
import Participant from "../models/participantModel"
var errorMessage = require("../errors.js")

exports.fetchAllParticipants = function(req, res) {
	Participant.fetchAllParticipants(req.params.graphNAME,function(err, participantArray) {
		if (err) {
			res.send(err)
		} else {
			if (participant && participantArray.length > 0) {
				let participants = []
				for (let i = 0; i < participantArray.length; i++) {
					let tempObj = {}
					tempObj.nodeID = participantArray[i]._fields[0].identity.low
					tempObj.label = participantArray[i]._fields[0].labels
					tempObj.properties = participantArray[i]._fields[0].properties
					participants.push(tempObj)
				}
				res.send(participants)
			} else {
				res.send(errorMessage.noResults)
			}
		}
	});
}

exports.getByParticipantId = function(req, res) {
	Participant.fetchParticipantDetails(req.params.graphNAME,req.params.id, function(err, participant) {
		if (err) {
			res.send(err)
		}
		else {
			if (participant && participant.length == 1) {
				console.log(participant)
				let tempObj = {}
				tempObj.nodeID = participant[0]._fields[0].identity.low
				tempObj.label = participant[0]._fields[0].labels
				tempObj.properties = participant[0]._fields[0].properties
				res.send(tempObj)
			} else {
				res.send(errorMessage.noResults)
			}
		}
	});
}
