/*
 * Mostly taken straight from express-graphql, so see their licence
 * (https://github.com/graphql/express-graphql/blob/master/LICENSE)
 */

// export type GraphiQLData = {
//   endpointURL: string;
//   subscriptionsEndpoint?: string;
//   query?: string;
//   variables?: Object;
//   operationName?: string;
//   result?: Object;
//   passHeader?: string;
//   editorTheme?: string;
//   websocketConnectionParams?: Object;
// };
const GRAPHIQL_VERSION = '0.11.11';
const SUBSCRIPTIONS_TRANSPORT_VERSION = '0.8.2';

// Ensures string values are safe to be used within a <script> tag.
function safeSerialize(data) {
  return data ? JSON.stringify(data).replace(/\//g, '\\/') : null;
}

const superGraphiql = {};

superGraphiql.renderGraphiQL = function(data) {
  // if(!(data instanceof GraphiQLData)) {
  //   throw new Error("invalid param passed");
  // }
  const endpointURL = data.endpointURL;
  const endpointWs =
    endpointURL.startsWith('ws://') || endpointURL.startsWith('wss://');
  const subscriptionsEndpoint = data.subscriptionsEndpoint;
  const usingHttp = !endpointWs;
  const usingWs = endpointWs || Boolean(subscriptionsEndpoint);
  const endpointURLWs =
    usingWs && (endpointWs ? endpointURL : subscriptionsEndpoint);

  //is the query in the body or in the query string. I think we need to import body parser
  // const queryString = data.query;
  // const variablesString = data.variables
  //   ? JSON.stringify(data.variables, null, 2)
  //   : null;
  // const resultString = null;
  // const operationName = data.operationName;
  const passHeader = data.passHeader ? data.passHeader : '';
  const websocketConnectionParams = data.websocketConnectionParams || null;

  return `<!DOCTYPE html> 
  < html >
    <head>
      <meta charset="UTF-8">
        <title>Super GraphiQL</title>
        <script src="https://use.fontawesome.com/992e44b468.js"></script>
        <script src="http://unpkg.com/react@15.6.1/dist/react.min.js"></script>
        <script src="http://unpkg.com/react-dom@15.6.1/dist/react-dom.min.js"></script>
        <!-- <script src="http://unpkg.com/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js"></script> -->
        <script type="text/javascript" src="./super-graphiql.min.js"></script>
        ${usingHttp ? `<script src="//cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js"></script>` : ''}
        ${usingWs ? `<script src="//unpkg.com/subscriptions-transport-ws@${SUBSCRIPTIONS_TRANSPORT_VERSION}/browser/client.js"></script>` : ''}
        ${usingWs && usingHttp ? '<script src="//unpkg.com/graphiql-subscriptions-fetcher@0.0.2/browser/client.js"></script>' : ''}
        <!-- <link rel="stylesheet" type="text/css" href="./super-graphiql.min.css" /> -->
    </head>
    <body>
      <script>
        ${
          usingWs
            ? `
          var subscriptionsClient = new window.SubscriptionsTransportWs.SubscriptionClient('${endpointURLWs}', {
            reconnect: true${
            websocketConnectionParams
              ? `,
            connectionParams: ${JSON.stringify(websocketConnectionParams)}`
              : ''
            }
          });
          var graphQLWSFetcher = subscriptionsClient.request.bind(subscriptionsClient);
          `
            : ''
        }
        ${
          usingHttp
            ? `
            // We don't use safe-serialize for location, because it's not client input.
            var fetchURL = "${endpointURL}";
            // Defines a GraphQL fetcher using the fetch API.
            function graphQLHttpFetcher(graphQLParams) {
                return fetch(fetchURL, {
                  method: 'post',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ${passHeader}
                  },
                  body: JSON.stringify(graphQLParams),
                  credentials: 'same-origin',
                }).then(function (response) {
                  return response.text();
                }).then(function (responseBody) {
                  try {
                    return JSON.parse(responseBody);
                  } catch (error) {
                    return responseBody;
                  }
                });
            }
          `
            : ''
        }
        ${
          usingWs && usingHttp
            ? `
            var fetcher =
              window.GraphiQLSubscriptionsFetcher.graphQLFetcher(subscriptionsClient, graphQLHttpFetcher);
          `
            : `
            var fetcher = ${usingWs ? 'graphQLWSFetcher' : 'graphQLHttpFetcher'};
          `
        }
         // Render <GraphiQL /> into the body.
        ReactDOM.render(
          React.createElement(GraphiQL, {
            fetcher: fetcher,
          }),
          document.body
        );
      </script>
    </body>
    <footer>
      <!-- <link href="https://unpkg.com/graphiql@${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
        <style>
          html, body {
          height: 100vh;
          margin: 0;
          overflow: hidden;
          width: 100%;
        }
      </style> -->
      <link rel="stylesheet" type="text/css" href="/super-graphiql.min.css" />
    </footer>
  </html>`
}

module.exports = superGraphiql;