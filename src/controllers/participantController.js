'use strict';
import Participant from "../models/participantModel"


exports.fetchAllParticipants = function(req, res) {
	Participant.fetchAllParticipants(function(err, participantArray) {
		res.send(JSON.stringify(participantArray));
	});
}

exports.getByParticipantId = function(req, res) {
	Participant.fetchParticipantDetails(req.params.id, function(err, participant) {
		if (err) {
			res.send(err)
		}
		else {
			res.send(participant)
		}
	});
}
exports.create = function(req, res) {
	Participant.create(req.params.id, function(err, participant) { 
		if (err) {
			res.send(err) 
		}
		else {
			res.send(participant)
		}
	});
}
