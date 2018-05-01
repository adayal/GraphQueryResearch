'use strict';
/**
 * @David Brock
 *
 * This file handles Engagement  or 'Digital Object' data from the graph database
 * To use the database, import the config file and then invoke the
 * 'getDatabaseConnection' function
 *
 */

var neo4j = require('neo4j-driver').v1
var config = require("../../config.js")
var db = neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password))
var errorMessage = require("../errors.js")

export default class Comparative {
	
	/**
	* Compare two graphs bassed on an engagement type and a categorical variable.
	* @param graphNAME1 name of the first graph
	* @param graphNAME2 name of the second graph
	* @param labelName of the categorical variable
	* @param engagementTYPE of the engagement to look for
	* @param callback(error, result)
	*/
	static compareTwoGraphs(graphNAME1, graphNAME2, labelName, engagementTYPE, callback) {
		let session = db.session();
		let str1 = 'Match (n: DIGITAL_OBJECT) Match (n)-[:IS_A]->(eType: '
		str1 += engagementTYPE
		str1 += ") Match (givenProfile: PROFILE)-[:PART_OF]->(network) where network.name = "
		str1 += "\'"+graphNAME1+"\'"
		str1 += ' Match (:'
		str1 += labelName
		str1 += ') '
		str1 += 'return network.name as Network, givenProfile.id as Person, count(n) as engagements UNION '
		str1 += 'Match (n: DIGITAL_OBJECT) Match (n)-[:IS_A]->(eType: '
		str1 += engagementTYPE
		str1 += ") Match (givenProfile: PROFILE)-[:PART_OF]->(network) where network.name = "
		str1 += "\'"+graphNAME2+"\'"
		str1 += ' Match (:'
		str1 += labelName
		str1 += ') '
		str1 += 'return network.name as Network, givenProfile.id as Person, count(n) as engagements'
		let resultPromise = session.readTransaction(function(transaction) {
			return transaction.run(str1)
		})
		resultPromise.then(function(result) {
			session.close()
			callback(null, result.records)
		}).catch(function(result) {
			session.close()
			callback(errorMessage.neo4jError + result.error, null)
		})
	}
}
	
		


