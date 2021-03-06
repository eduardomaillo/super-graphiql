import React from 'react';
import { render } from 'react-dom';
import { GraphiQL } from './../../src/components/GraphiQL';
import fetch from 'isomorphic-fetch';

let search = window.location.search;
let parameters = {};
search.substr(1).split('&').forEach(function (entry) {
  let eq = entry.indexOf('=');
  if (eq >= 0) {
    parameters[decodeURIComponent(entry.slice(0, eq))] =
      decodeURIComponent(entry.slice(eq + 1));
  }
});

// if variables was provided, try to format it.
if (parameters.variables) {
  try {
    parameters.variables =
      //parses the user input from a json object to a formatted string
      JSON.stringify(JSON.parse(parameters.variables), null, 2);
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared
function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

function onEditOperationName(newOperationName) {
  parameters.operationName = newOperationName;
  updateURL();
}

function updateURL() {
  var newSearch = '?' + Object.keys(parameters).filter(function (key) {
    return Boolean(parameters[key]);
  }).map(function (key) {
    return encodeURIComponent(key) + '=' +
      encodeURIComponent(parameters[key]);
  }).join('&');
  history.replaceState(null, null, newSearch);
}

// Defines a GraphQL fetcher using the fetch API. You're not required to
// use fetch, and could instead implement graphQLFetcher however you like,
// as long as it returns a Promise or Observable.
function graphQLFetcher(graphQLParams, path, variables) {
  // let queryString = '?' + Object.keys(graphQLParams).filter(function (key) {
  //   return Boolean(graphQLParams[key]);
  // }).map(function (key) {
  //   return encodeURIComponent(key) + '=' +
  //     encodeURIComponent(graphQLParams[key]);
  // }).join('&');

  if (Array.isArray(graphQLParams)) {
    const promises = [];

    graphQLParams.forEach((queryObj) => {
      let cleanQueryObj = { query: queryObj.query, operationName: queryObj.operationName, variables: variables};

      let promise = new Promise((resolve, reject) => {
        fetchRequest(cleanQueryObj, path).then(response => {
          resolve(response)
        });
      })
      promises.push(promise);
    })

    return Promise.all(promises).then((allResponses) => {
      return allResponses;
    })
  } else {
    // Handles initial Introspection Query
    return new Promise((resolve, reject) => {
      fetchRequest(graphQLParams, path).then((response) => {
        resolve(response);
      });
    });
  }
}

function fetchRequest(graphQLParams, path) {
  // This example expects a GraphQL server at the path /graphql.
  // Change this to point wherever you host your GraphQL server.
  return new Promise((resolve, reject) => {
    fetch(path, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(graphQLParams),
    
    credentials: 'include', // Always send user credentials (cookies, basic http auth, etc..), even for cross-origin calls.
    // mode: 'no-cors'
    }).then(function (response) {
      return response.text();
    })
    .then(function (responseBody) {
      try {
        resolve(JSON.parse(responseBody));
      } catch (error) {
        resolve(responseBody);
      }
    });
  });
}

render((
    <div>
      <GraphiQL
        fetcher={graphQLFetcher}
        query= {parameters.query}
        variables={parameters.variables}
        operationName={parameters.operationName}
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        onEditOperationName={onEditOperationName}
      />
    </div>
), document.getElementById('contents'));