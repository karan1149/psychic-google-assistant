'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp(functions.config().firebase);
var db = firebaseAdmin.database();

var whitelist = ['http://localhost:8000', 'https://psychic-df2b4.firebaseapp.com', 'https://getpsychicreader.com', 'https://textedit.co', 'https://psychic-editor.firebaseapp.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  }
};

const cors = require('cors')(corsOptions);

var possibleBotNames = ["mary", "barbara", "maria", "linda", "lisa", "susan", "nancy", "karen", "laura", "michelle", "sarah", "amy", "ashley", "kelly", "emma"];
var possiblePrompts = [
  "Have any more questions for me?", 
  "Any more questions?", 
  "Any more questions for me?", 
  "You can ask me another question.", 
  "Why don't you ask another question?", 
  "If you were impressed by that, you can ask me another question.", 
  "Impressive, right? Why don't you ask another question?", 
  "Ask me more questions!", 
  "Ask me another question if you so desire.", 
  "Ask me another question if you want to see my psychic powers again.", 
  "Ask me another question if you haven't had enough of my psychic powers.", 
  "Do you still doubt my psychic powers? Ask another question!", 
  "I'm ready for another question anytime.", 
  "Ask me another question if you'd like.", 
  "Got any more questions?", 
  "Got any more questions for me?"
];
var possiblePreResponses = [
  "<speak>Hmmmm...<break time='1.5s'/></speak>", 
  "<speak>Hmmmmmmm...<break time='1.5s'/></speak>", 
  "<speak>Hmmmm... <break time='1.5s'/>This is a difficult one.<break time='1s'/> My psychic powers tell me: <break time='1s'/></speak>", 
  "<speak>Hmmmm... <break time='1.5s'/>This is a hard one.<break time='1s'/> My powers are telling me: <break time='1s'/></speak>", 
  "<speak>Hmmmm... <break time='1.5s'/>I got it.<break time='1s'/></speak>", 
  "<speak>That's a hard question...<break time='2s'/> I figured it out.<break time='1s'/></speak>"
];

var possibleVagueResponses = [
  "<speak>I don't have much to say right now. You can ask another question.</speak>",
  "<speak>I'm not sure that question deserves an answer. Ask another question.</speak>",
  "<speak>That question can be answered many different ways. Why don't you ask another question?</speak>",
  "<speak>Something is telling me the answer to that question is more complicated than you think. Ask another question.</speak>",
  "<speak>That question is more complicated than you think. You can ask another question.</speak>",
  "<speak>That question is more complicated than you think. Why don't you ask another question?</speak>",
  "<speak>Many secrets lie in the answer to that question. You can ask another question.</speak>",
  "<speak>I don't think it's best for me to answer that right now. You can ask another question.</speak>"
];

var possibleYesResponses = [
  "<speak>The answer is yes.</speak>",
  "<speak>Absolutely, yes.</speak>",
  "<speak>My psychic powers tell me the answer is yes.</speak>",
  "<speak>My powers tell me the answer is yes.</speak>",
  "<speak>Yes.</speak>",
  "<speak>My powers are telling me the answer is yes.</speak>",
  "<speak>I can say with certainty that the answer is yes.</speak>",
  "<speak>The answer is definitely yes.</speak>",
  "<speak>I'm certain the answer is yes.</speak>",
  "<speak>I'm fairly sure the answer is yes.</speak>",
  "<speak>My powers are currently telling me the answer is yes.</speak>",
  "<speak>My powers indicate the answer is yes.</speak>",
  "<speak>The answer that has come to me is yes.</speak>",
];

var possibleNoResponses = [
  "<speak>The answer is no.</speak>",
  "<speak>Absolutely, no.</speak>",
  "<speak>My psychic powers tell me the answer is no.</speak>",
  "<speak>My powers tell me the answer is no.</speak>",
  "<speak>No.</speak>",
  "<speak>My powers are telling me the answer is no.</speak>",
  "<speak>I can say with certainty that the answer is no.</speak>",
  "<speak>The answer is definitely no.</speak>",
  "<speak>I'm certain the answer is no.</speak>",
  "<speak>I'm fairly sure the answer is no.</speak>",
  "<speak>My powers are currently telling me the answer is no.</speak>",
  "<speak>My powers indicate the answer is no.</speak>",
  "<speak>The answer that has come to me is no.</speak>",
];

exports.registerUsername = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var registerObject = request.body;
    // validate request 
    if (typeof(registerObject.pin) != "string" || typeof(registerObject.username) != "string" || typeof(registerObject.botName) != "string" || !isAlphaNumeric(registerObject.username) || isNaN(registerObject.pin) || registerObject.username.length == 0 || registerObject.botName.length == 0 || registerObject.pin.length == 0){
      response.status(400).json({"error": "Your registration information does not appear to be valid. Be sure that the username is alphanumeric and that the PIN is a valid number."});
      return;
    } 
    registerObject.username = registerObject.username.toLowerCase();
    registerObject.botName = registerObject.botName.toLowerCase();
    var registrationRef = db.ref('registrations').child(encodeAsFirebaseKey(registerObject.pin));
    registrationRef.once("value", function(snapshot){
      var registerInfo = snapshot.val();
      if (registerInfo == null){
        response.status(400).json({"error": "Your PIN seems to be incorrect."})
      } else {
        if (registerInfo.botName != registerObject.botName){
          response.status(400).json({"error": "Your bot name seems to be incorrect."});
        } else {     
          var usernameRef = db.ref('usernames').child(encodeAsFirebaseKey(registerObject.username));
          usernameRef.transaction(function(usernameInfo){
            if (usernameInfo == null){
              return registerInfo.userID;
            } else {
              return;
            }
          }, function(error, committed, usernameInfoSnapshot){
            if (error){
              response.status(500).json({"error": "Adding your username information to database failed abnormally. Refresh and try again!"});
            } else if (!committed) {
              response.status(400).json({"error": "Your username appears to be taken."})
            } else {
              // does not currently clear out previous usernames from usernames database if new one is entered
              var userRef = db.ref("users").child(encodeAsFirebaseKey(registerInfo.userID)).child("last_username");
              userRef.set(registerObject.username, function(errorLinking){
                if (errorLinking) {
                  response.status(500).json({"error": "Abnormal error linking your assistant to your username. Try again!"});
                } else {
                  registrationRef.set(null, function(errorRegistrationRef){
                    if (errorRegistrationRef){
                      response.status(500).json({"error": "Could not clear old registration data, but your username appears to be registered now."});
                    } else {
                      response.status(200).json({"success": "Successfully linked your username to your device. Click here if you are not automatically redirected.", url: "https://getpsychicreader.com/tutorial.html?registered=" + registerObject.username})
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
    if (typeof(phraseObject.boolean) != "boolean" || phraseObject.boolean && typeof(phraseObject.yes) != "boolean" || !phraseObject.boolean && typeof(phraseObject.value) != "string" || !phraseObject.id || typeof(phraseObject.id) != "string"){
      response.status(400).json({"error": "input phrase object does not appear to be valid"});
      return;
    }

    // map request to ID if it is valid
    var userID = phraseObject.id;
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
    var loginObject = request.body;
    // validate requests
    if (typeof(loginObject.username) != "string" || typeof(loginObject.botName) != "string" || !isAlphaNumeric(loginObject.username) || loginObject.username.length == 0 || loginObject.botName.length == 0){
      response.status(400).json({"error": "Username and botname do not appear to have the correct format."});
      return;
    }
    loginObject.username = loginObject.username.toLowerCase();
    loginObject.botName = loginObject.botName.toLowerCase();
    var usernameRef = db.ref("usernames").child(encodeAsFirebaseKey(loginObject.username));
    usernameRef.once("value", function(snapshot){
      var usernameInfo = snapshot.val();
      if (usernameInfo == null) {
        response.status(400).json({"error": "Username appears to be incorrect. If you forgot your username, just ask your Google Assistant for help with initiation."});
      } else {
        var userRef = db.ref("users").child(encodeAsFirebaseKey(usernameInfo)).child("botName")
        userRef.once("value", function(botNameSnapshot){
          var botNameInfo = botNameSnapshot.val();
          if (botNameInfo != loginObject.botName){
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
    var botName = possibleBotNames[Math.floor(Math.random() * possibleBotNames.length)];
    var textResponse = 'Hello, my name is ' + botName + '! Ask me any question you like.';
    app.ask(textResponse);
    var userID = app.body_.originalRequest.data.user.userId;
    var botRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("botName");
    botRef.set(botName, function(error){
      if (error) console.log("error writing bot name to userID", userID);
    });
    recordLastResponse(userID, textResponse);
  }

  function unknownDeeplinkHandler(app) {
    var textResponse = `Welcome to your Psychic! I can guess many things about \
      you, but I cannot make guesses about \
      ${app.getRawInput()}. \
      Instead, I shall guess your name or location. Which do you prefer?`
    app.ask(textResponse);
    recordLastResponse(app.body_.originalRequest.data.user.userId, textResponse);
  }

  function questionHandler(app) {
    console.log(app.body_.originalRequest.data.user.userId);
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
        var textResponse = getTextResponse(phraseInfo.phraseObject)
        app.ask(textResponse);

        phraseInfoRef.off("value");
        phraseInfoRef.set(null);
        sent = true;

        recordLastResponse(userID, textResponse);
      }
    });
    setTimeout(function(){
      console.log("checking if sent");
      if (!sent){
        console.log("not sent");
        var textResponse = "I don't have much to say";
        app.ask(textResponse);
        phraseInfoRef.off("value");
        phraseInfoRef.set(null);
        recordLastResponse(userID, textResponse);
      }
    }, 6000);

  }

  function initiationHandler(app) {
    app.ask("Initiation starts now");
  }

  function repeatHandler(app) {
    var userID = app.body_.originalRequest.data.user.userId;
    var lastResponseRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("lastResponse");
    lastResponseRef.once('value', function(lastResponseSnapshot){
      var lastResponseInfo = lastResponseSnapshot.val();
      var now = Date.now();
      if (lastResponseInfo == null || lastResponseInfo.time == null || now - lastResponseInfo.time >= 60000){
        var textResponse = "Honestly, I don't remember what I said. Did you have any questions to ask me?"
        app.ask(textResponse);
        recordLastResponse(userID, textResponse);
      } else {
        var textResponse = "<speak>I'll repeat what I said. <break time='1s'/> " + lastResponseInfo.response + "</speak>"
        app.ask(textResponse);
      }
    })
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
}

function recordLastResponse(userID, response){
  var lastResponseRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("lastResponse");
  lastResponseRef.set({"time": Date.now(), "response": response}, function(error){
    if (error) console.log("There was an error in recording last response", userID, response);
  });
}
