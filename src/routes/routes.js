'use strict';

module.exports = function(app) {
	var participantController = require('../controllers/participantController');
	var graphController = require('../controllers/graphController');
	app.route('/participant').get(participantController.fetchAllParticipants)
//.post(participantController.create);
	app.route('/view_graph').get(graphController.fetchGraph)

	app.route('/participant/:id').get(participantController.getByParticipantId)
}
