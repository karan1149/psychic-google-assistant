'use strict';

var possibleTexts = ["Hello my name is Karan"]

var textIndex = 0
var currentIndex = 4

var box = document.getElementById("text")
box.value = possibleTexts[textIndex].slice(0, currentIndex);
var prevValue = box.value;
box.addEventListener('input', handleKeyDown)


var listening = false;
var phrase = "";

var disabled = false;

var apiURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/acceptPhrase";

function handleKeyDown() {
  var e = {type: "", key: ""};
  var currLength = box.value.length;
  var prevLength = prevValue.length;
  if (currLength == prevLength + 1 && box.value.slice(0, currLength - 1) == prevValue){
    // one character added
    e.key = box.value.charAt(currLength - 1);
    e.type = getKeyType(e.key);
    if (e.key == "!"){
      disabled = !disabled;
      box.value = prevValue;
      return;
    }
    if (disabled){
      prevValue = box.value;
      return;
    }
    box.value = prevValue;
  } else if (currLength == prevLength - 1 && prevValue.slice(0, prevLength - 1) == box.value){
    // backspace
    e.type = "Backspace";
    e.key = "";
    currentIndex--;
    if (listening && phrase.length > 0){
      phrase = phrase.slice(0, phrase.length - 1);
    }
    prevValue = box.value;
    return;
  } else {
    for (var i = currLength - 2; i > 0; i--){
      // check if many is alphanumeric
      if (box.value.slice(0, i) == prevValue){
        e.type = "Many";
        e.key = box.value.slice(i);
        box.value = prevValue;
      }
    }
    if (e.type == ""){
      console.log("unexpected", prevValue, box.value);
    } 
  }
  console.log(e);
  
  if (listening && (e.type == "Key" || e.key == " " || e.type == "Digit" || e.type == "Many" || e.key == ",")){
    phrase = phrase + e.key
  }
  else if (e.key == "y"){
    sendPhrase({"boolean": true, "yes": true});
  } else if (e.key == "n"){
    sendPhrase({"boolean": true, "yes": false});
  } else if (e.key == "."){
    if (listening){
      if (phrase.length > 0){
        sendPhrase({"boolean": false, "value": phrase});
      }
      phrase = "";
      listening = false;
    } else {
      listening = true;
    }
  }
  box.value = box.value + possibleTexts[textIndex].charAt(currentIndex % possibleTexts[textIndex].length)
  prevValue = box.value;
  currentIndex++;
}

function sendPhrase(phraseObject){
  console.log("sending", phraseObject);
  // construct an HTTP request
  var xhr = new XMLHttpRequest();
  xhr.open("POST", apiURL);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.send(JSON.stringify(phraseObject));
}

function getKeyType(key){
  if (key != ".")
    return "Key"
  else 
    return ""
}
