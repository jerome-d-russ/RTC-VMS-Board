// JavaScript Document
	var regex = /.*?\?=(.+)/
	var linkTo = regex.exec(document.URL)[1];
	var msg = new Object();
	msg.request = "loadCallback";
	msg.url = linkTo;
	chrome.runtime.sendMessage(JSON.stringify(msg), function(response) {
		vmsSettings = response;
		if (vmsSettings.added == true){
			location.assign(linkTo);
		}			
	});