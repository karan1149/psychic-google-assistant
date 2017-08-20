'use strict';

var registerURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/registerUsername";
var loginURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/login";

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