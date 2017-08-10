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
  function welcomeHandler(app) {
    // Check if user is initiated
    app.ask('Hello, World!');
  }

  function unknownDeeplinkHandler(app) {
    app.ask(`Welcome to your Psychic! I can guess many things about \
      you, but I cannot make guesses about \
      ${app.getRawInput()}. \
      Instead, I shall guess your name or location. Which do you prefer?`);
  }

  function questionHandler(app) {
    app.ask("Do you have any more questions?")
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', welcomeHandler);
  actionMap.set('deeplink.unknown', unknownDeeplinkHandler)
  actionMap.set('input.unknown', questionHandler)

  app.handleRequest(actionMap);
});
