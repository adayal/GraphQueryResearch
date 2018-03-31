'use strict';
var graph = require("../models/graphModel");
exports.fetchGraph = function(req, res) {
	graph.fetchGraph(function(err, graphArray) {
		res.send(JSON.stringify(graphArray));
	});
}

