'use strict';

var participantController = require('../controllers/participantController');
var graphController = require('../controllers/graphController');
var logController = require('../controllers/logController');
var engagementController = require('../controllers/engagementController');
var comparativeController = require('../controllers/comparativeController');

/**
 * Define a route here
 * 
 * A route is effectively an 'API' endpoint.
 *
 * Each route takes a callback with the following paramters (request, response)
 *
 * The basic structure for an API route looks like this:
 * Client --> /graph/view (endpoint) --> graphController.fetchGraph (controller) --> graphModel.fetchGraph (model) --> callback(result) (send back to) <-- graphController.fetchGraph <-- response.send(result) (send back to) <-- Client
 * 
 *
 * Using ':someVar' is a variable in a URL
 *
 * @IMPORTANT
 * When using repeated ':someVar' in a URL for multiple urls, it is important to remember that this is a regex match.
 * Using the same pattern in a different API endpoint will have unexpected results
 *
 * For more information, please look at the documentation for Express routing
 */

module.exports = function(app) {

	//participant fetching APIs
	app.route('/:graphNAME/participant').get(participantController.fetchAllParticipants)
	app.route('/:graphNAME/participant/:id').get(participantController.getByParticipantId)
	
	//graph interaction APIs
	app.route('/graph/view').get(graphController.fetchGraph)
	app.route('/graph/findByPropertyValue').get(graphController.findPropertyValue)
	app.route('/graph/describe').get(graphController.fetchSchema)
	app.route('/graph/addProperty').post(graphController.createNewProperty)
	app.route('/graph/addLabel').get(graphController.createNewLabel)
	app.route('/graph/addRelationship').post(graphController.createNewRelationship)
	app.route('/graph/find').post(graphController.findNode)
	app.route('/graph/fetchNode').get(graphController.fetchNode)
	
	//view log APIs
	app.route('/view/log/all').get(logController.getAllLogs)
	app.route('/view/log/developer').get(logController.findDeveloperLogs)
	app.route('/view/log/graph').get(logController.findGraphLogs)
	app.route('/view/log/participant').get(logController.findParticipantLogs)
	app.route('/view/log/log').get(logController.findLogLogs)
	
	//comparative and engagement APIs	
	app.route('/:graphNAME/engagement/:engagementTYPE').get(engagementController.fetchEngagementDetails)
	app.route('/compare/:graphNAME1/:graphNAME2/:labelName/:engagementTYPE').get(comparativeController.compareTwoGraphs)
}	
