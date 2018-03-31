'use strict';

module.exports = function(app) {
	var participantController = require('../controllers/participantController');
	var graphController = require('../controllers/graphController');
	app.route('/participant').get(participantController.fetchAllParticipants)
	app.route('/view_graph').get(graphController.fetchGraph)
	app.route('/participant/:id').get(participantController.getByParticipantId)
	//app.route('/graph/add/predicate').post(graphController.addPredicate)
}
