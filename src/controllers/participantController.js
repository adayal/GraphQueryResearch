'use strict';
import Participant from "../models/participantModel"
var errorMessage = require("../errors.js")
var logger = require("./logController.js")
var log = {
	queryType: 'participant',
	developerAPI: false,
	didModifyGraph: false,
}

/**
 * Fetch all particpants from a specifc graph
 * Send back a liste of nodeIDs and properties of all the particpants in the graph
 *
 */
exports.fetchAllParticipants = function(req, res) {	
	if (!req.params.graphNAME) {
		res.send(errorMessage.missingParameter)
		return	
	}
	log.request = req
	log.timestamp = new Date().getTime()
	Participant.fetchAllParticipants(req.params.graphNAME, function(err, participantArray) {
		if (err) {
			logger.writeErrorLog(log, err)
			res.send(err)
		} else {
			log.cypher = participantArray
			if (participantArray) {

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
			logger.writeLog(log)
		}
	});
}

/**
 * Fetch a participant based on a participant's user id.
 * Note that this is different than a node's id.
 * Return node information about the participant 
 *
 */
exports.getByParticipantId = function(req, res) {
	if (!req.params.graphNAME || !req.params.id) {
		res.send(errorMessage.missingParameter)
		return
	}	
	
	log.request = req
	log.timestamp = new Date().getTime()
	Participant.fetchParticipantDetails(req.params.graphNAME,req.params.id, function(err, participant) {
		if (err) {
			res.send(err)
		}
		else {
			log.cypher = participant
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
			logger.writeLog(log)
		}
	});
}
