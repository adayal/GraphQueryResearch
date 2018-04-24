'use strict';

module.exports = function(app) {
	var participantController = require('../controllers/participantController');
	var graphController = require('../controllers/graphController');
	var logController = require('../controllers/logController');
	var engagementController = require('../controllers/engagementController');
	var comparativeController = require('../controllers/comparativeController');
	app.route('/:graphNAME/participant').get(participantController.fetchAllParticipants)
	app.route('/graph/view').get(graphController.fetchGraph)
	app.route('/graph/findByPropertyValue').get(graphController.findPropertyValue)
	app.route('/graph/describe').get(graphController.fetchSchema)
	app.route('/:graphNAME/participant/:id').get(participantController.getByParticipantId)
	app.route('/graph/addProperty').post(graphController.createNewProperty)
	app.route('/graph/addLabel').get(graphController.createNewLabel)
	app.route('/graph/addRelationship').post(graphController.createNewRelationship)
	app.route('/graph/find').post(graphController.findNode)
	app.route('/graph/fetchNode').get(graphController.fetchNode)
	app.route('/view/log/all').get(logController.getAllLogs)
	app.route('/view/log/developer').get(logController.findDeveloperLogs)
	app.route('/view/log/graph').get(logController.findGraphLogs)
	app.route('/view/log/participant').get(logController.findParticipantLogs)
	app.route('/view/log/log').get(logController.findLogLogs)
	app.route('/:graphNAME/engagement/:engagementTYPE').get(engagementController.fetchEngagementDetails)
	app.route('/compare/:graphNAME1/:graphNAME2/:labelName/:engagementTYPE').get(comparativeController.compareTwoGraphs)
}	
