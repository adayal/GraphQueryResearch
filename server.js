var MongoClient = require('mongodb').MongoClient;
var express = require('express'),
app = express(),
port = process.env.PORT || 3001,
bodyParser = require('body-parser'),
bb = require('express-busboy'),
multer = require('multer');
bb.extend(app, {

	upload: true,
	path: './savedImages',
	allowedPath: /./

});
var routes = require('./lib/routes/routes.js');
routes(app);
app.listen(port);
console.log("API server started on: " + port);
