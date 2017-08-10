'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp(functions.config().firebase);

const cors = require('cors')({origin: true});

exports.acceptPhrase = functions.https.onRequest((request, response) => {
  cors(req, res, () => {
    console.log(request.body);
    res.status(200).send();
  });

});

exports.psychicGuess = functions.https.onRequest((request, response) => {
  const app = new App({request, response});

  // Fulfill action business logic
  function welcomeHandler (app) {
    // Check if user is initiated
    app.tell('Hello, World!');
  }

  // API.AI actions
  const WELCOME_ACTION = 'input.welcome';
  const REQUEST_NAME_PERMISSION_ACTION = 'request_name_permission';
  const REQUEST_LOC_PERMISSION_ACTION = 'request_location_permission';
  const READ_MIND_ACTION = 'read_mind';
  const UNHANDLED_DEEP_LINK_ACTION = 'deeplink.unknown';

  const actionMap = new Map();
  actionMap.set('input.welcome', welcomeHandler);

  app.handleRequest(actionMap);
});
