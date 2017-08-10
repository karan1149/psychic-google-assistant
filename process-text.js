'use strict';

var possibleTexts = ["Hello my name is Karan"]

var textIndex = 0
var currentIndex = 0

var box = document.getElementById("text")
box.addEventListener('keydown', handleKeyDown)

var listening = false;
var phrase = "";

var disabled = false

// TODO add disable feature
function handleKeyDown(e) {
  console.log(e)
  if (e.key == "$"){
    disabled = !disabled;
    e.preventDefault();
    return false;
  }
  if (disabled){
    return true;
  }
  e.preventDefault();
  if (listening && (e.code.startsWith("Key") || e.key == " ")){
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
  currentIndex++;
  return false;
}

function sendPhrase(phraseObject){
  console.log(phraseObject);
}
