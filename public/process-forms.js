'use strict';

var registerURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/acceptPhrase";
var loginURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/acceptPhrase";

function loginHandler(e){
	e.preventDefault();
	var loginObject = {};
	loginObject.username = document.getElementById("username").value;
	loginObject.botName = document.getElementById("botName").value;
	$.ajax(loginURL, {
		type: "POST",
		data: loginObject,
		contentType: "application/json",
		dataType: "json",
		success: function(data){
			console.log(data);
		}, 
		error: function(error){
			console.log(error);
			document.getElementById("message").innerText = error.error;
		}
	});
}

function registerHandler(e){
	e.preventDefault();
	var registerObject = {};
	registerObject.username = document.getElementById("username").value;
	registerObject.botName = document.getElementById("botName").value;
	registerObject.pin = document.getElementById("pin").value;
	$.ajax(loginURL, {
		type: "POST",
		data: registerObject,
		contentType: "application/json",
		dataType: "json",
		success: function(data){
			console.log(data);
		}, 
		error: function(error){
			console.log(error);
			document.getElementById("message").innerText = error.error;
		}
	});
}