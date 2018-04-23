'use strict';
/**
 * @Amit Dayal
 *
 * This file handles Partipant or 'Profile' data from the graph database
 * To use the database, import the config file and then invoke the
 * 'getDatabaseConnection' function
 *
 */
var config = require("../../config.js")
var neo4j = require('neo4j-driver').v1;
var db = neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password));
var errorMessages = require("../errors.js")

export default class Participant {

	static fetchParticipantDetails(graphNAME, participantID, callback) {
		let session = db.session();
		let resultPromise = session.readTransaction(function(transaction) {
			 let result =  transaction.run('MATCH (n:PROFILE)-[:PART_OF]-(Network) where Network.name = {graphName} AND n.uid = {uidParam} RETURN n', {graphName: graphNAME,  uidParam: neo4j.int(participantID)})
			 return result;
		});
		resultPromise.then(function(result) {
			session.close();
			console.log(result.records);
			callback(null, result.records);
		}).catch(function(err) {
			session.close();
			callback(errorMessage.neo4jError + err, null)
		});
	}

	/**
 	* Fetch all the profiles in the graph
 	* CYPHER QUERY: 'MATCH (n: PROFILE) RETURN n
 	* @param callback: callback to accept errors and results
 	* @callback error: errors that occured
 	* @callback results: results of the query
 	* format: callback(error, result)
 	*
 	*/
	static fetchAllParticipants(graphNAME,callback) {
		let session = db.session();
		let resultPromise = session.readTransaction(function(transaction) {
			 return transaction.run('MATCH (n:PROFILE)-[:PART_OF]-(Network) where Network.name = {graphName} return n', {graphName: graphNAME})
		});
		
		resultPromise.then(function(result) {
			session.close();
			callback(null, result.records);
		}).catch(function(error) {
			session.close();
			callback(errorMessage.neo4jError + err, null)
		});
	

	}
}
