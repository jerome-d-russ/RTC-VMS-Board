// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var callbacks = [];
var skipBuild = false;

// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  // If the letter 'g' is found in the tab's URL...
  var rtcUrl = localStorage["rtcURL"];
	regexp = "http.*" + rtcUrl + ".*runSavedQuery.*";
	if (tab.url.match(regexp)) {
    // ... show the page action icon.
    chrome.pageAction.show(tabId);
    if (changeInfo.status == "complete"){
      if (callbacks.length > 0){ // && changeInfo.status == "complete") {
        var index = callbacks.indexOf(tab.url);
        if (index > -1) {
          executeScripts(chrome.tabs,tabId);
          //chrome.tabs.executeScript(tabId, {file: "content_script.js"});    
          callbacks.splice(index, 1);
        }
      } else {
        regexp = /.*&buildVMS/i;
        if (tab.url.match(regexp)) {
          if(skipBuild == true){
            skipBuild = false;
          }else{
            executeScripts(chrome.tabs,tabId);
            //chrome.tabs.executeScript(tabId, {file: "content_script.js"});
          }
        }
      }
    }
  }

  if(localStorage["rrcFullscreenIndicator"] == 'true'){
    var rrcUrl = rtcUrl.replace(/rtc/,"rrc");
    regexp = "http.*" + rrcUrl + ".*showArtifact.*";
    if (tab.url.match(regexp)) {
      chrome.pageAction.setIcon({tabId: tabId, path:chrome.extension.getURL("fullscreen.png")});
      chrome.pageAction.setTitle({tabId: tabId, title:"Go FullScreen!"});
      chrome.pageAction.show(tabId);
    }
  }
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.pageAction.onClicked.addListener(function(activeTab)
{
  var rtcUrl = localStorage["rtcURL"];
  regexp = "http.*" + rtcUrl + ".*runSavedQuery.*";
  if (activeTab.url.match(regexp)) {
    executeScripts(chrome.tabs,activeTab.id);
  } else {
    if(localStorage["rrcFullscreenIndicator"] == 'true'){
      var rrcUrl = rtcUrl.replace(/rtc/,"rrc");
      regexp = "http.*" + rrcUrl + ".*showArtifact.*";
      if (activeTab.url.match(regexp)) {
        chrome.tabs.executeScript(activeTab.id,{file:"goFullscreen.js"});
      }
    }
  }
	//chrome.tabs.executeScript(activeTab.id, {file: "content_script.js"});
});

function executeScripts(ct,tId){
  if(localStorage["burndownIndicator"] == 'true'){
    ct.executeScript(tId, {file: "d3.min.js"}, 
    ct.executeScript(tId, {file: "sbd.js"},
    ct.executeScript(tId, {file: "content_script.js"})));
  } else {
    ct.executeScript(tId, {file: "content_script.js"});
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	msg = JSON.parse(request);
  	if (msg.request == "getSettings"){
      sendResponse({
          rtcURL: localStorage["rtcURL"],
          pointsIndicator: localStorage["pointsIndicator"],
          burndownIndicator: localStorage["burndownIndicator"]
        });
		}else{
			if (msg.request == "loadCallback"){
				//is the page in the callback list? if it is, return true, else return false
				callbacks[callbacks.length] = msg.url;
				sendResponse({added: true});	
			}else{
        if (msg.request == "skipBuild"){
          skipBuild = true;
          sendResponse({added: true});  
        }
      }
		}
	}
);

if(!localStorage["version"]){
  localStorage["version"] = "1.3";
  chrome.tabs.create({url: "options.html"});
}
	
if (localStorage["version"] != "1.3") {
  localStorage["version"] = "1.3";
  chrome.notifications.create({
    type: "basic",
    title: "Build a Burndown Chart!!",
    message: "Is your VMS board for an iteration? Would you like to see it in burndown chart form? Now you can!",
    iconUrl: "icon-128.png"
  });
}