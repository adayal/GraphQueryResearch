'use strict';
/**
 * @David Brock
 *
 * This file handles Engagement  or 'Digital Object' data from the graph database
 * To use the database, import the config file and then invoke the
 * 'getDatabaseConnection' function
 *
 */

var neo4j = require('neo4j-driver').v1;
var db = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "password"));

export default class Comparative {
	constructor() {
	
	}
	
	static compareTwoGraphs(graphNAME1, graphNAME2, labelName, engagementTYPE, callback) {
		let session = db.session();
		let str1 = 'Match (givenProfile: PROFILE)-[:PART_OF]->(network) where network.name = '
		str1 += "\'"+graphNAME1+"\'"
		str1 += 'Match (:'
		str1 += labelName
		str1+= ')'
		str1 += ' Match (givenProfile)-[:FROM]-(engagement) Match (engagement)-[:TO]->(toProfile) Match (engagement)-[:IS_A]->(eTYPE: '
		str1 += engagementTYPE
		str1 += ') return network.name as Network, givenProfile.id as Person1, toProfile.id as Person2, count(toProfile) as count order by givenProfile.id UNION Match (givenProfile: PROFILE)-[:PART_OF]->(network) where network.name = '
		str1 += "\'"+graphNAME2+"\'"
		str1 += 'Match (:'
		str1 += labelName
		str1+= ') Match (givenProfile)-[:FROM]-(engagement) Match (engagement)-[:TO]->(toProfile) Match (engagement)-[:IS_A]->(eTYPE: '
		str1 += engagementTYPE
		str1 += ') return network.name as Network, givenProfile.id as Person1, toProfile.id as Person2, count(toProfile) as count order by givenProfile.id '
		let resultPromise = session.readTransaction(function(transaction) {
		let result =  transaction.run(str1)
			 return result;
		});
		resultPromise.then(function(result) {
			session.close();
			console.log(result.records);
			callback(null, result.records);
		}).catch(function(result) {
			session.close();
			console.log(result.error);
			callback(result.error, null)
		});
	}
}
	
		

