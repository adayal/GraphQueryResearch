'use strict';
//var graph = require("../models/graphModel");
import Graph from "../models/graphModel"

exports.fetchGraph = function(req, res) {
	Graph.fetchGraph(function(err, graphArray) {
		res.send(JSON.stringify(graphArray));
	});
}

exports.findPropertyValue = function(req, res) {
	
	Graph.findPropertyValue(req.query.labelName, req.query.propertyName, req.query.engagementType, req.query.propertyValue, function(err, result) {
		res.send(result);
	});
}

