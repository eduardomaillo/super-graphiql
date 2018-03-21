const express = require("express");
const app = express();
const graphqlHTTP = require("express-graphql");
const { graphql } = require("graphql");
const schema = require("./schema");
const studentController = require("./../Controllers/studentController");
const subjectController = require("./../Controllers/subjectController");
const bodyParser = require("body-parser");
const path = require("path");

const mongoose = require("mongoose");
const myURI = "mongodb://user:pw1@ds113169.mlab.com:13169/graphql-test";
const uri = process.env.MONGO_URI || myURI;
mongoose.connect(uri);
mongoose.connection.once("open", () => {
  console.log("Connected to Database");
});
//

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res) => {
  res.header({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Request-Headers": "Content-Type"
  });
});
app.use("/*/graphiql.css", (req, res) => {
  res.sendFile(path.join(__dirname, "./../../../graphiql.css"));
});

app.use(express.static(__dirname + "./../../"));

//------ To test database using Postman ------//

app.use("/newStudent", studentController.addStudent);
app.use("/removeStudent", studentController.rmStudent);
app.use("/newSubject", subjectController.addSubject);
app.use("/removeSubject", subjectController.rmSubject);

//------ Original GraphiQL implementation can be seen at route /graphql ------//

app.use("/graphiql", graphqlHTTP({ schema, graphiql: true }));

//------ To test your GraphQL schema/server using Postman ------//

// A get request to retrieve the result of a query using HTTP, via a query string
app.get("/get", (req, res) => {
  let { query } = req.query;
  graphql(schema, query).then(response => {
    res.header("Access-Control-Allow-Origin", "*");
    res.json(response);
  });
});

// A post request to retrieve the resutl of a query using HTTP, via specifying the query in a json in the body of the message
app.use("/graphql", (req, res) => {
  console.log(req.body);
  graphql(schema, req.body.query.toString()).then(response => {
    res.json(response);
  });
});

app.listen(9000, () => {
  console.log("listening on 9000");
});
