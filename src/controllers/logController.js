'use strict'

var server = require('../../server.js')

/**
 * Get all logs from mongo
 * Exposed to API
 */
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
 *  Write object to a document and save in mongo
 *  Internal function only
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

/**
 * Write object and error and save in mongo
 * Internal function only
 */
exports.writeErrorLog = function(obj, error) {
	obj.errors = error
	server.getDB(function(db) {
		db.collection(server.getCollectionname()).insertOne(obj, function(err, res) {
			if (err) console.log(err)
		})
	})
}

/**
 * Find all the logs where 'developerAPI' is true
 * Exposed to API 
 */
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

/**
 * Find all the logs where 'queryType' is 'graph'
 * Exposed to API
 */
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

/**
 * Find all the logs where 'queryType' is 'participant'
 * Exposed to API
 */
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

/**
 * Find all the logs where the log was queried for
 * Exposed to API
 */
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
