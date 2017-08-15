'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp(functions.config().firebase);
var db = firebaseAdmin.database();

var whitelist = ['http://localhost:8000', 'https://psychic-df2b4.firebaseapp.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  }
};

// TODO set host correctly
// const cors = require('cors')({origin: "http://localhost:8000"});
const cors = require('cors')(corsOptions);

exports.registerUsername = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var registerObject = request.body;
    // validate request 
    if (typeof(registerObject.pin) != "number" || typeof(registerObject.username) != "string" || typeof(registerObject.botName) != "string" || !isAlphaNumeric(registerObject.username)){
      response.status(400).json({"error": "Your registration information does not appear to be valid. Be sure that the username is alphanumeric and that the PIN is a valid number."});
      return;
    } 
    var registrationRef = db.ref('registrations').child(encodeAsFirebaseKey(registerObject.pin));
    ref.once("value", function(snapshot){
      var registerInfo = snapshot.val();
      if (registerInfo == null){
        response.status(400).json({"error": "Your PIN seems to be incorrect."})
      } else {
        if (registerInfo.botName != registerObject.botName){
          response.status(400).json({"error": "Your bot name seems to be incorrect."});
        } else {     
          var usernameRef = db.ref('usernames').child(encodeAsFirebaseKey(registerObject.username));
          usernameRef.once("value", function(usernameSnapshot){
            if (usernameSnapshot.val() != null){
              response.status(400).json({"error": "Your username appears to be taken."})
            } else {
              registrationRef.set(null, function(error){
                if (error){
                  response.status(500).json({"error": "Could not clear old registration data."});
                } else {
                  usernameRef.set(registerInfo.userID, function(error){
                    if (error) {
                      response.status(500).json({"error": "Could not register new username."});
                    } else {
                      response.status(200).json({"success": "Successfully linked your username to your device."})
                    }
                  });
                }
              });
            }
          });
        }
      }
    });
  }); 
});

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
        console.log({"message": "An error ocurred when writing to db", "error": error, "userID": userID, "phraseObject": phraseObject, "userID": userID});
      } else {
        response.status(200).json({"message": "Successfully wrote phrase"});
        console.log({"message": "Successfully wrote phrase"})
      }
    });
  });

});

exports.login = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    loginObject = request.body;
    // validate requests
    if (typeof(loginObject.username) != "string" || typeof(loginObject.botName) != "string" || !isAlphaNumeric(username)){
      response.status(400).json({"error": "Username and botname do not appear to have the correct format."});
      return;
    }
    var usernameRef = db.ref("usernames").child(encodeAsFirebaseKey(loginObject.username));
    usernameRef.once("value", function(snapshot){
      var usernameInfo = snapshot.val();
      if (usernameInfo == null) {
        response.status(400).json({"error": "Username appears to be incorrect. If you forgot your username, just ask your Google Assistant for help with initiation."});
      } else {
        var userRef = db.ref("users").child(encodeAsFirebaseKey(usernameInfo)).child("botName")
        userRef.once("value", function(botNameSnapshot){
          var botNameInfo = botNameSnapshot.val();
          if (botNameInfo.toLowerCase() != loginObject.botName.toLowerCase()){
            response.status(400).json({"error": "The assistant name you entered appears to be incorrect."})
          } else {
            response.status(200).json({"success": "UserID successfully retrieved.", "id": usernameInfo});
          }
        });
        
      }
    });

  });
});

exports.psychicGuess = functions.https.onRequest((request, response) => {
  const app = new App({request, response});

  // Fulfill action business logic
  function welcomeHandler(app) {
    // Check if user is initiated
    app.ask('Hello, World! Ask me any question you like.');
  }

  function unknownDeeplinkHandler(app) {
    app.ask(`Welcome to your Psychic! I can guess many things about \
      you, but I cannot make guesses about \
      ${app.getRawInput()}. \
      Instead, I shall guess your name or location. Which do you prefer?`);
  }

  function questionHandler(app) {
    var userID = "test";
    var phraseInfoRef = db.ref("users").child(userID).child("phraseInfo");
    var now = Date.now();
    var sent = false;
    phraseInfoRef.off("value");
    phraseInfoRef.on("value", function onPhraseInfoChange(snapshot){
      var phraseInfo = snapshot.val();
      if (phraseInfo == null){
        console.log("phraseInfo is null, sent value is", sent);
        return;
      }
      // coodinate time better
      var difference = now - phraseInfo.time
      console.log(phraseInfo, difference);
      if (difference <= 5000 && difference > -5000){
        app.ask(getTextResponse(phraseInfo.phraseObject));

        phraseInfoRef.off("value");
        phraseInfoRef.set(null);
        sent = true;
      }
    });
    setTimeout(function(){
      console.log("checking if sent");
      if (!sent){
        console.log("not sent");
        app.ask("I don't have much to say");
        phraseInfoRef.off("value");
        phraseInfoRef.set(null);
      }
    }, 6000);

  }

  function initiationHandler(app) {
    app.ask("Initiation starts now");
  }

  function repeatHandler(app) {
    app.ask("I dont want to repeat anything for you.");
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', welcomeHandler);
  actionMap.set('deeplink.unknown', unknownDeeplinkHandler);
  actionMap.set('input.unknown', questionHandler);
  actionMap.set("initiation.help", initiationHandler);
  actionMap.set("repeat", repeatHandler);

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

function getTextResponse(phraseObject){
  if (phraseObject.boolean){
    if (phraseObject.yes){
      return "yes";
    } else {
      return "no";
    }
  } else {
    return phraseObject.value;
  }
}

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};
