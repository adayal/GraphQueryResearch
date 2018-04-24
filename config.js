/**
 * @Amit Dayal
 *
 * From this file, you can change the configuration to connect to the graph
 * When using the database all you need to do is import this file and then
 * call the function 'getDatabaseConnection'.
*/


module.exports = {
	username: "neo4j",
	password: "password",
	url: "bolt://localhost",
	nodePort: 3000,
	mongourl: "mongodb://localhost:27017",
	mongodb: "GraphQuery",
	mongoCollection: "logs",
	pathToUploadFiles: "./uploadedCSV"
};
