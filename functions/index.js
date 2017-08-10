'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp(functions.config().firebase);

// TODO set host correctly
const cors = require('cors')({origin: "http://localhost:8000"});

exports.acceptPhrase = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var phraseObject = request.body;
    if (phraseObject.boolean == true){
      if (phraseObject.yes == true){
        console.log("yes");
      } else {
        console.log("no");
      }
    } else if (phraseObject.boolean == false){
      console.log(phraseObject.value);
    }
    response.status(200).send();
  });

});

exports.psychicGuess = functions.https.onRequest((request, response) => {
  const app = new App({request, response});

  // Fulfill action business logic
  function welcomeHandler (app) {
    // Check if user is initiated
    app.tell('Hello, World!');
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', welcomeHandler);

  app.handleRequest(actionMap);
});
