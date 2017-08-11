'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp(functions.config().firebase);
var db = firebaseAdmin.database();

// TODO set host correctly
const cors = require('cors')({origin: "http://localhost:8000"});

exports.acceptPhrase = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var phraseObject = request.body;
    // validate request
    if (typeof(phraseObject.boolean) != "boolean" || phraseObject.boolean && typeof(phraseObject.yes) != "boolean" || !phraseObject.boolean && typeof(phraseObject.value) != "string"){
      response.status(400).json({"error": "input phrase object does not appear to be valid"});
      return;
    }

    // map request to ID if it is valid
    var userID = "test";
    var userRef = db.ref('users').child(encodeAsFirebaseKey(userID));
    userRef.update({"phraseInfo": {"time": Date.now(), "phraseObject": phraseObject}}, function(error){
      if (error){
        response.status(500).json({"message": "An error ocurred when writing to db", "error": error})
        console.log({"message": "An error ocurred when writing to db", "error": error, "userID": userID, "phraseObject": phraseObject});
      } else {
        response.status(200).json({"message": "Successfully wrote phrase"});
        console.log({"message": "Successfully wrote phrase"})
      }
    });
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

function encodeAsFirebaseKey (string) {
  return string.replace(/%/g, '%25')
    .replace(/\./g, '%2E')
    .replace(/#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/\//g, '%2F')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D');
}
