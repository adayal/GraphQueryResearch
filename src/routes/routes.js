'use strict';

module.exports = function(app) {
	var participantController = require('../controllers/participantController');
	var graphController = require('../controllers/graphController');
	app.route('/:graphNAME/participant').get(participantController.fetchAllParticipants)
	app.route('/view_graph').get(graphController.fetchGraph)
	app.route('/graph/findByPropertyValue').get(graphController.findPropertyValue)
	app.route('/graph/describe').get(graphController.fetchSchema)
	app.route('/:graphNAME/participant/:id').get(participantController.getByParticipantId)
	app.route('/graph/addProperty').post(graphController.createNewProperty)
	app.route('/graph/addLabel').get(graphController.createNewLabel)
	//app.route('/graph/add/predicate').post(graphController.addPredicate)
}
