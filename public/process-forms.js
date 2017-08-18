'use strict';

var registerURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/registerUsername";
var loginURL = "https://us-central1-psychic-df2b4.cloudfunctions.net/login";

function loginHandler(){
	var loginObject = {};
	loginObject.username = document.getElementById("username").value;
	loginObject.botName = document.getElementById("botName").value;
	$.ajax({
		url: loginURL,
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

function registerHandler(){
	var registerObject = {};
	registerObject.username = document.getElementById("username").value;
	registerObject.botName = document.getElementById("botName").value;
	registerObject.pin = document.getElementById("pin").value;
	$.ajax({
		url: registerURL,
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