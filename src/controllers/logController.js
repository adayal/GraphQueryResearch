'use strict'

var server = require('../../server.js')

exports.getAllLogs = function(req, res) {
	server.getDB(function(db) {
		console.log(db)
	})
}
