'use strict';
/**
 * @Amit Dayal
 *
 * This file handles Partipant or 'Profile' data from the graph database
 * To use the database, import the config file and then invoke the
 * 'getDatabaseConnection' function
 *
 */

var config = require("../../config")
var db = config.getDatabaseConnection();

export default class Participant {
	constructor() {
	
	}
	
	static fetchParticipantDetails(participantID, callback) {
		db.cypher({
				query: 'MATCH (n: PROFILE{uid: "{uid}"}) RETURN n',
				params: {
					uid: participantID
				}
			}, 
			function (err, results) {
				if (err) {
					callback(err, null)
				} else {
					callback(null, results);
				}
			}
		);
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
	static fetchAllParticipants(callback) {
		db.cypher({
				query: 'MATCH (n: PROFILE) RETURN n'
			}, 
			function (err, results) {
				if (err) {
					callback(err, null)
				} else {
					callback(null, results);
				}
			}
		);
	}
}
