'use strict';
/**
 * @David Brock
 *
 * This file handles Engagement  or 'Digital Object' data from the graph database
 * To use the database, import the config file and then invoke the
 * 'getDatabaseConnection' function
 *
 */
var config = require("../../config.js")
var neo4j = require('neo4j-driver').v1;
var db = neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password));
var errorMessage = require("../errors.js")

export default class Engagement {	
	
	/**
 	* Fetch the engagement details of a all profiles within a specific graph for a specific engagementTYPE
 	* @param graphNAME to search in
 	* @param engagementTYPE to search for
 	* @callback(error, result)
 	*/
	static fetchEngagementDetails(graphNAME, engagementTYPE, callback) {
		let session = db.session();
		let str1 = 'Match (givenProfile: PROFILE)-[:PART_OF]->(network) where network.name = '
		str1 += "\'"+graphNAME+"\'"
		str1 += ' Match (givenProfile)-[:FROM]-(engagement) Match (engagement)-[:TO]->(toProfile) Match (engagement)-[:IS_A]->(eType:'
                str1 += engagementTYPE
		str1 += ') return givenProfile.id as Person1, toProfile.id as Person2, count(toProfile) as count order by givenProfile.id'
		let resultPromise = session.readTransaction(function(transaction) {
			return transaction.run(str1)
		})
		resultPromise.then(function(result) {
			session.close()
			callback(null, result.records)
		}).catch(function(err) {
			session.close()
			callback(errorMessage.neo4jError + err, null)
		})
	}
}
	
		


