// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var callbacks = [];
var skipBuild = false;

// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  // If the letter 'g' is found in the tab's URL...
	regexp = "http.*" + localStorage["rtcURL"] + ".*runSavedQuery.*";
	if (tab.url.match(regexp)) {
    // ... show the page action icon.
    chrome.pageAction.show(tabId);
    if (changeInfo.status == "complete"){
      if (callbacks.length > 0){ // && changeInfo.status == "complete") {
        var index = callbacks.indexOf(tab.url);
        if (index > -1) {
          chrome.tabs.executeScript(tabId, {file: "content_script.js"});    
          callbacks.splice(index, 1);
        }
      } else {
        regexp = /.*&buildVMS/i;
        if (tab.url.match(regexp)) {
          if(skipBuild == true){
            skipBuild = false;
          }else{
            chrome.tabs.executeScript(tabId, {file: "content_script.js"});
          }
        }
      }
    }
  }
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.pageAction.onClicked.addListener(function(activeTab)
{
	chrome.tabs.executeScript(activeTab.id, {file: "content_script.js"});
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	msg = JSON.parse(request);
  	if (msg.request == "getSettings"){
      sendResponse({
          rtcURL: localStorage["rtcURL"],
          pointsIndicator: localStorage["pointsIndicator"]
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
	
if (localStorage["version"] != "1.25") {
  //chrome.tabs.create({url: "options.html"});
  chrome.notifications.create({
    type: "basic",
    title: "The RTC VMS Board can now be bookmarked!",
    message: "Simply build the VMS Board and then bookmark the URL. Every time you go to that URL, the VMS Board will build automatically!",
    iconUrl: "icon-128.png"
  });
}
localStorage["version"] = "1.25";