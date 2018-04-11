'use strict'

var server = require('../../server.js')

exports.getAllLogs = function(req, res) {
	server.getDB(function(db) {
		db.collection(server.getCollectionName()).find({}).toArray(function(err, result) {	
			if (err)
				res.send(err)
			else
				res.send(result)
		})
	})
}

exports.getDatabase = function(callback) {
	server.getDB(function(db) {
		callback(db)
	})
}

/**
 * Internal function only
 *
 */
exports.writeLog = function(obj, callback) {	
	server.getDB(function(db){
		db.collection(server.getCollectionName()).insertOne(obj, function(err, res) {
			if (callback)
				callback(err, res)
			else
				if (err) console.log(err)
		})
	})
}

exports.writeErrorLog = function(obj, error) {
	obj.errors = error
	server.getDB(function(db) {
		db.collection(server.getCollectionname()).insertOne(obj, function(err, res) {
			if (err) console.log(err)
		})
	})
}

exports.findDeveloperLogs = function(req, res) {
	server.getDB(function(db) {
		db.collection(server.getCollectionName()).find({}, {developerAPI: true}).toArray(function(err, result) {
			if (err)
				res.send(err)
			else
				res.send(result)
		})
	})
}

exports.findGraphLogs = function(req, res) {
	server.getDB(function(db) {
		db.collection(server.getCollectionName()).find({}, {queryType: 'graph'}).toArray(function(err, result) {
			if (err)
				res.send(err)
			else
				res.send(result)
		})
	})
}


exports.findParticipantLogs = function(req, res) {
	server.getDB(function(db) {
		db.collection(server.getCollectionName()).find({}, {queryType: 'participant'}).toArray(function(err, result) {
			if (err)
				res.send(err)
			else
				res.send(result)
		})
	})
}


exports.findLogLogs = function(req, res) {
	server.getDB(function(db) {
		db.collection(server.getCollectionName()).find({}, {queryType: 'log'}).toArray(function(err, result) {
			if (err)
				res.send(err)
			else
				res.send(result)
		})
	})
}
