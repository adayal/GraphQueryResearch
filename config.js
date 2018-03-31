/**
 * @Amit Dayal
 *
 * From this file, you can change the configuration to connect to the graph
 * When using the database all you need to do is import this file and then
 * call the function 'getDatabaseConnection'.
 * 
 * Though it's more advance, a multi-threaded/connection server should pool database
 * connections rather than creating new graph databases. This doesn't do that but we
 * can make that modification much more easily here.
 *
 */ 

var neo4j = require('neo4j')
var configuration = {
	username: "neo4j",
	password: "password",
	host: "localhost",
	port: "7474"
}
var db = null;

module.exports = {
	getDatabaseConnection: function() {
		if (!db) {
			db = new neo4j.GraphDatabase("http://" + configuration.username + ":" + configuration.password + "@" + configuration.host + ':' + configuration.port);
			return db;
		} else {
			return db;
		}
	}	
};
