var config = require("./config")
var MongoClient = require('mongodb').MongoClient;
var mongourl = config.mongourl;
var dbName = config.mongodb
var mongoDB = null;
var collectionName =  config.mongoCollection
var express = require('express'),

app = express(),
port = process.env.PORT || config.nodePort,
bodyParser = require('body-parser'),
bb = require('express-busboy'),
multer = require('multer');
bb.extend(app, {

	upload: true,
	path: config.pathToUploadFiles,
	allowedPath: /./

});
var routes = require('./lib/routes/routes.js');
routes(app);
app.listen(port);
exports.getCollectionName = function() {
	return collectionName 
}
exports.getDB = function(callback) {
	if (!mongoDB) {
		MongoClient.connect(mongourl, function(err, client) {
			if (err) {
				console.log("mongo client error: " + err)
			} else {
				console.log("connected successfully")
				mongoDB = client.db(dbName)
				mongoDB.createCollection(collectionName, function(err, res) {
					if (err) throw err
					console.log("collection created")
					callback(mongoDB)
				})
				//client.close()
				//callback(mongoDB)
			}
		});
	} else {
		callback(mongoDB)
	}
}

console.log("API server started on: " + port);

