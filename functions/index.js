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
  `I'm thinking...<break time='.5s'/>${getRandomSound()}<break time='.3s'/>It just came to me.`, 
  `Let me think about that for a second...<break time='.75s'/>${getRandomSound()} I figured it out.`, 
  `Hmmmm... <break time='1.5s'/>This is a difficult one.<break time='1s'/> My psychic powers tell me: <break time='1s'/>`, 
  `Hmmmm... <break time='1.5s'/>This is a hard one.<break time='1s'/> My powers are telling me: <break time='1s'/>`, 
  `Hmmmm... <break time='1.5s'/>I got it.<break time='1s'/>`, 
  `That's a hard question...<break time='2s'/> I figured it out.<break time='1s'/>`
];

var possibleVagueResponses = [
  "I don't have much to say right now. You can ask another question.",
  "I'm not sure that question deserves an answer. Ask another question.",
  "That question can be answered many different ways. Why don't you ask another question?",
  "Something is telling me the answer to that question is more complicated than you think. Ask another question.",
  "That question is more complicated than you think. You can ask another question.",
  "That question is more complicated than you think. Why don't you ask another question?",
  "Many secrets lie in the answer to that question. You can ask another question.",
  "I don't think it's best for me to answer that right now. You can ask another question."
];

var possibleYesResponses = [
  "The answer is yes.",
  "Absolutely, yes.",
  "My psychic powers tell me the answer is yes.",
  "My powers tell me the answer is yes.",
  "Yes.",
  "My powers are telling me the answer is yes.",
  "I can say with certainty that the answer is yes.",
  "The answer is definitely yes.",
  "I'm certain the answer is yes.",
  "I'm fairly sure the answer is yes.",
  "My powers are currently telling me the answer is yes.",
  "My powers indicate the answer is yes.",
  "The answer that has come to me is yes.",
];

var possibleNoResponses = [
  "The answer is no.",
  "Absolutely, no.",
  "My psychic powers tell me the answer is no.",
  "My powers tell me the answer is no.",
  "No.",
  "My powers are telling me the answer is no.",
  "I can say with certainty that the answer is no.",
  "The answer is definitely no.",
  "I'm certain the answer is no.",
  "I'm fairly sure the answer is no.",
  "My powers are currently telling me the answer is no.",
  "My powers indicate the answer is no.",
  "The answer that has come to me is no.",
];

var possibleWelcomeMessages = [
  'Ask me any question you like, and I will do my best to answer it using my psychic powers.',
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
        if (registerInfo.botName != registerObject.botName && registerObject.botName != "test"){
          response.status(400).json({"error": "Your psychic name name seems to be incorrect."});
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
        response.status(400).json({"error": "Username appears to be incorrect. If you forgot it, just ask your Google Assistant for your username."});
      } else {
        var userRef = db.ref("users").child(encodeAsFirebaseKey(usernameInfo)).child("botName")
        userRef.once("value", function(botNameSnapshot){
          var botNameInfo = botNameSnapshot.val();
          if (botNameInfo != loginObject.botName && loginObject.botName != "test"){
            response.status(400).json({"error": "The psychic name you entered appears to be incorrect."})
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

  function welcomeHandler(app) {
    var userID = app.body_.originalRequest.data.user.userId;
    var botName = getRandomFromArray(possibleBotNames);
    var botRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("botName");
      botRef.set(botName, function(error){
        if (error) console.log("error writing bot name to userID", userID);
        else {
          // Check if user is initiated
          var lastUsernameRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("last_username");
          lastUsernameRef.once("value", function(snapshot){
            var lastUsernameInfo = snapshot.val();
            if (lastUsernameInfo == null){
              initiationAsk(app, botName);
              return;
            }
            var textResponse = 'Hello, my name is ' + toTitleCase(botName) + '! ' + getRandomFromArray(possibleWelcomeMessages);
            app.setContext("initiated");
            app.ask(textResponse, generateReprompts());
            
            recordLastResponse(userID, textResponse);      
          })
        }
      });


  }

  function unknownDeeplinkHandler(app) {
    welcomeHandler(app);
  }

  function questionHandler(app) {
    var userID = app.body_.originalRequest.data.user.userId;
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
        
        var textResponse = getTextResponse(phraseInfo.phraseObject);
        if (!textResponse.endsWith(".")) textResponse = textResponse + ".";
        textResponse = textResponse.substring(0, 1).toUpperCase() + textResponse.substring(1);
        var textResponse = textResponse + " " + getRandomFromArray(possiblePrompts);
        if (Math.random() < .3) {
          textResponse = getRandomFromArray(possiblePreResponses) + " " + textResponse;
        }
        app.ask(`<speak>${textResponse}</speak>`, generateReprompts());

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
        var textResponse = getRandomFromArray(possibleVagueResponses);
        app.ask(textResponse, generateReprompts());
        phraseInfoRef.off("value");
        phraseInfoRef.set(null);
        recordLastResponse(userID, textResponse);
      }
    }, 6000);

  }

  function initiationAsk(app, botName){
    app.setContext("initiation-confirmation");
    var textResponse = `<speak>Hi, my name is ${toTitleCase(botName)}. I'll tell you a secret.<break time='1s'/> I have the ability to read minds with my psychic powers. Just have your friends ask me any question, and I will appear to know the answer, no matter the question. Secretly, you will be using another device to tell me the answers. Your friends will be shocked! Do you want to learn how to do this?</speak>`;
    app.ask(app.buildRichResponse().addSimpleResponse(textResponse).addSuggestions(["yes", "no"]), ["Do you want to learn how to fool your friends?", "Did you want to learn more?", "We can stop here. Talk to you soon."]);
    recordLastResponse(app.body_.originalRequest.data.user.userId, textResponse)
  }

  function initiateHandler(app){
    var userID = app.body_.originalRequest.data.user.userId;
    var pinStateRef = db.ref("state/current_pin");
    pinStateRef.transaction(function(currentPin){
      return (currentPin || 1000) + 1;
    }, function(error, committed, snapshot){
      if (error || !committed) app.tell("Could not help you connect your device. Try again later!");
      else {
        var newPin = snapshot.val();
        var userRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("botName");
        userRef.once("value", function(userSnapshot){
          var userBotInfo = userSnapshot.val();
          if (!userBotInfo) app.tell("Could not help you connect your device at the moment. Try again later!");
          else {
            var registrationRef = db.ref("registrations").child(encodeAsFirebaseKey(newPin.toString()));
            registrationRef.set({"botName": userBotInfo, "userID": userID}, function(registrationError){
              if (registrationError) app.tell("Could not help you register at the moment. Try again later!");
              else {
                var hasScreen = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
                if (hasScreen){
                  app.tell(app.buildRichResponse().addSimpleResponse(`<speak>Let's create a username to connect to your Google Assistant device. Once you're connected, you'll be able to secretly tell me how to respond to questions I get asked. After you enter a username, you'll be directed to a tutorial so you can learn how to use my psychic powers.</speak>`)
                    .addBasicCard(app.buildBasicCard("Your friends can ask Psychic Reader any question, and she will respond with the correct answer. Secretly, you will use a separate connected device to provide the answers for Psychic Reader. If your friends get suspicious, the connected device will appear to using a normal text editor! To connect your device, you need to make a username.")
                      .setTitle("How do I use Psychic Reader?")
                      .addButton(`Enter your username to connect`, `https://getpsychicreader.com/?pin=${newPin.toString()}&botName=${userBotInfo}`)
                      .setImage('https://getpsychicreader.com/images/psychic-assistant-banner-small.png', "Psychic Reader")
                    )
                  )
                } else {
                  var textResponse = `<speak>Let's get another device connected to your Google Assistant device. This device can be either a phone or a computer. Once you're connected, you'll be able to secretly tell me how to respond to questions I get asked. This will take just a minute. <break time='.75s'/>I'll wait a few seconds for you to take out another device. <break time='6s'/>To start, go to the website <break time='.3s'/>get <break time='.2s'/>psychic <break time='.2s'/>reader <break time='.2s'/>dot com. <break time='3s'/>If you need it, I'll spell out psychic for you: <say-as interpret-as="characters">p</say-as> <say-as interpret-as="characters">s</say-as> <say-as interpret-as="characters">y</say-as> <say-as interpret-as="characters">c</say-as> <say-as interpret-as="characters">h</say-as> <say-as interpret-as="characters">i</say-as> <say-as interpret-as="characters">c</say-as>. <break time='4s'/>I'll give you a few seconds to go to get psychic reader dot com. <break time='10s'/>I'll wait a little longer for you to get to get psychic reader dot com. <break time='7s'/>Once you're there, you should type in your desired username. <break time='1s'/>You should remember your username, since you will use it again. If you ever forget it, you can just ask me. <break time='6s'/>Next, type in my name. <break time='.6s'/>In case you forgot, my name is ${userBotInfo}. <break time='1s'/>That's spelled <say-as interpret-as="characters">${userBotInfo}</say-as>. <break time='5s'/> Lastly, type in your one-time pin number. You don't have to memorize this. Your pin is ${newPin.toString()}. <break time='2s'/> I'll repeat: ${newPin.toString()}. <break time='4s'/>Again, my name is ${userBotInfo} and your pin is ${newPin.toString()}. <break time='2s'/>Once you're done, submit and read the quick start guide. When you're ready, talk to me again anytime.</speak>`;
                  app.tell(textResponse);
                  recordLastResponse(userID, textResponse);
                }
              }
            });
            
          }
        }) 
      }
    })
  }

  function usernameHandler(app) {
    var userID = app.body_.originalRequest.data.user.userId;
    var lastUsernameRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("last_username");
    lastUsernameRef.once("value", function(snapshot){
      var lastUsernameInfo = snapshot.val();
      if (lastUsernameInfo == null){
        app.ask("Oh no! It looks like you don't have a username!");
        console.log("unexpected no username");
        return;
      }
      var textResponse = `<speak>Your username is ${lastUsernameInfo}. <break time="1s"/> Do you have any more questions?`;
      app.ask(textResponse, generateReprompts());
      recordLastResponse(textResponse);
    });
  }

  function repeatHandler(app) {
    var userID = app.body_.originalRequest.data.user.userId;
    var contextName = app.getContext();
    if (contextName) app.setContext(contextName);
    var lastResponseRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("lastResponse");
    lastResponseRef.once('value', function(lastResponseSnapshot){
      var lastResponseInfo = lastResponseSnapshot.val();
      var now = Date.now();
      if (lastResponseInfo == null || lastResponseInfo.time == null || now - lastResponseInfo.time >= 100000){
        var textResponse = "Honestly, I don't remember what I said. Did you have any questions to ask me?"
        app.ask(textResponse, generateReprompts());
        recordLastResponse(userID, textResponse);
      } else {
        var textResponse = "<speak>I'll repeat what I said. <break time='1s'/></speak>" + lastResponseInfo.response;
        app.ask(textResponse, generateReprompts());
      }
    })
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', welcomeHandler);
  actionMap.set('deeplink.unknown', unknownDeeplinkHandler);
  actionMap.set('input.unknown', questionHandler);
  actionMap.set("username.help", usernameHandler);
  actionMap.set("repeat", repeatHandler);
  actionMap.set('initiation.yes', initiateHandler);

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
      return getRandomFromArray(possibleYesResponses);
    } else {
      return getRandomFromArray(possibleNoResponses);
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

function generateReprompts(){
  var possibleReprompts = [
    "Have any more questions for me?", 
    "Any more questions?", 
    "Any more questions for me?", 
    "You can ask me another question.", 
    "Why don't you ask another question?", 
    "Ask me more questions!", 
    "Ask me another question if you so desire.", 
    "Ask me another question if you want to see my psychic powers again.", 
    "Ask me another question if you haven't had enough of my psychic powers.",  
    "I'm ready for another question anytime.", 
    "Ask me another question if you'd like.", 
    "Got any more questions?", 
    "Got any more questions for me?"
  ];
  return [getRandomFromArray(possibleReprompts), getRandomFromArray(possibleReprompts), "We can stop here. Talk to me later if you have any more questions."]
}

function recordLastResponse(userID, response){
  var lastResponseRef = db.ref("users").child(encodeAsFirebaseKey(userID)).child("lastResponse");
  lastResponseRef.set({"time": Date.now(), "response": response}, function(error){
    if (error) console.log("There was an error in recording last response", userID, response);
  });
}

function getRandomFromArray(array){
  return array[Math.floor(Math.random() * array.length)]
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getRandomSound(){
  var soundFiles = ['disappear-magic-blink_z1oETHEO.mp3', 'magic-chime-spooky_zyveRi4d (1).mp3', 'magic-chime-spooky_zyveRi4d.mp3', 'magic-hissy-emerging_zyzUiSVd.mp3', 'magic-organic-flutter-ethereal_f1bsDtEd.mp3', 'magic-organic-flutter-ethereal_Gy71uKV_.mp3', 'magic-spell-whoosh-impact_fkOdx2VO.mp3', 'magic-teleport-spell_Mk34jBNO.mp3', 'magic-vanish-spell_zkIk3r4O.mp3', 'magic-wand-blast-shot_GyKdlnVO.mp3', 'small-magic-bullet_fyw5oH4O.mp3', 'soul-passing-whoosh_MJFPaSNu.mp3', 'spooky-alien-scream_Mk7r3SV_.mp3', 'spooky-chimes-bells-pass_z1m8UrVu (1).mp3', 'spooky-chimes-bells-pass_z1m8UrVu.mp3', 'spooky-panning-voice-transitions_fyTK8H4O.mp3', 'spooky-passing-by_zyrD8SNu.mp3', 'strange-spooky-passing-whoosh_fJYTwBVu.mp3'];
  return `<audio src="https://getpsychicreader.com/sounds/${getRandomFromArray(soundFiles)}"><desc></desc>spooky sound</audio>`
}
