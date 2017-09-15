# Psychic Reader, for Google Assistant

Psychic Reader is an app for Actions on Google that can be invoked on any Google Assistant device (phones, Google Home, Allo, etc.) by saying "Talk to Psychic Reader". This is the backend and most of the frontend (the text editor frontend is [here](https://github.com/karan1149/psychic-google-assistant-editor)).

The user of the app can tell their friends to ask Psychic Reader any question, and the app will always respond with the correct answer. Secretly, the user will be using a separate connected device to provide answers for Psychic Reader. The connected device will appear to be using an innocent text editor, not typing anything suspicious. 

For example, a friend could ask, "How old am I?", and the user of the text editor types in a secret command (".20 years old." in this case), and the Psychic Reader will respond with "20 years old".

As this is happening, the editor appears to be typing out something else:
![Image of text editor](https://getpsychicreader.com/images/editor-demo.gif)

## How does it work?

The text editor sends a command via a HTTP POST request to the backend whenever it receives a relevant command. The backend routes the command to the relevant user so that when a question is asked (within a few seconds before or after the request was received), the Psychic Reader responds appropriately. 

The interesting part of developing this was ensuring that the timing works out right: if someone asks Psychic Reader a question it does not yet have the answer to (the most common usage), the app may need to wait a few seconds until it receives a request from the text editor. However, Google Assistant itself times out in about 5 seconds, so we need to send a reply immediately after we receive a command from the text editor. Directives don't exist in Firebase that let you do exactly what I needed easily, so I had to get creative and use Firebase's real-time database watchers as semaphores to coordinate communication between code that accepted commands from the text editor and code that send replies to Google. Also, busy waiting on Node server is not a good idea because other requests can't be handled, so all of this needed to be done asynchronously. 

## Get Started

Details on how to begin using Psychic Reader can be found in the [tutorial](https://getpsychicreader.com/tutorial.html).
