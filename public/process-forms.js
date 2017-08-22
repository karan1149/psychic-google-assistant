'use strict';

var registerURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/registerUsername";
var loginURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/login";

function populateRegistration(){
    var retrievedPin = getParameterByName('pin');
    var retrievedBotName = getParameterByName('botName');
    if (retrievedPin && retrievedBotName){
        document.getElementById("botName").value = retrievedBotName;
        document.getElementById("botName").style.display = "none";
        document.getElementById("pin").value = retrievedPin;
        document.getElementById("pin").style.display = "none";
    }
}

function loginHandler(){
    document.getElementById("message").innerText = "";
	var loginObject = {};
	loginObject.username = document.getElementById("username").value;
	loginObject.botName = document.getElementById("botName").value;
    console.log("sending", loginObject);
	$.ajax({
		url: loginURL,
		type: "POST",
		data: JSON.stringify(loginObject),
		contentType: "application/json",
		dataType: "json",
		success: function(data){
			console.log(data);
		}, 
		error: function(error){
			console.log(error);
			document.getElementById("message").innerText = error.responseJSON.error;
		}
	});
}

function registerHandler(){
    document.getElementById("message").innerText = "";
	var registerObject = {};
	registerObject.username = document.getElementById("username").value;
	registerObject.botName = document.getElementById("botName").value;
	registerObject.pin = document.getElementById("pin").value;
    console.log("sending", registerObject);
	$.ajax({
		url: registerURL,
		type: "POST",
		data: JSON.stringify(registerObject),
		contentType: "application/json",
		dataType: "json",
		success: function(data){
			console.log(data.responseJSON);
		}, 
		error: function(error){
			console.log(error);
			document.getElementById("message").innerText = error.responseJSON.error;
		}
	});
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}