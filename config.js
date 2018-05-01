/**
 * From this file, you can change the configuration to connect to the neo4j instance.
 * You can also define your mongo database url, credentials, etc. 
*/


module.exports = {
	username: "neo4j",
	password: "horcruxes1",
	url: "bolt://localhost",
	nodePort: 3000,
	mongourl: "mongodb://localhost:27017",
	mongodb: "GraphQuery",
	mongoCollection: "logs",
	pathToUploadFiles: "./uploadedCSV",
	bigDataNodeLimit: 300
};
