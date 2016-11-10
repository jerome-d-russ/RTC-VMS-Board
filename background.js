// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var callbacks = [];
var skipBuild = false;
var configCache;
var VERSION = 127;

function getConfig(cb) {
	chrome.storage.sync.get({
		rtcURL: '',
		pointsIndicator: false,
		burndownIndicator: false,
		rrcFullscreenIndicator: false,
		version: 0
	}, function (options) {
		configCache = options;
		cb(options);
	});
}

// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
	getConfig(function (config) {
		// If the letter 'g' is found in the tab's URL...
		var rtcUrl = config.rtcURL;
		var regexp = 'http.*' + rtcUrl + '.*runSavedQuery.*';
		if (tab.url.match(regexp)) {
			// ... show the page action icon.
			chrome.pageAction.show(tabId);
			if (changeInfo.status === 'complete') {
				if (callbacks.length > 0) {
					var index = callbacks.indexOf(tab.url);
					if (index > -1) {
						executeScripts(config, chrome.tabs, tabId);
						callbacks.splice(index, 1);
					}
				} else {
					regexp = /.*&buildVMS/i;
					if (tab.url.match(regexp)) {
						if (skipBuild === true) {
							skipBuild = false;
						} else {
							executeScripts(config, chrome.tabs, tabId);
						}
					}
				}
			}
		}

		if (config.rrcFullscreenIndicator === true) {
			var rrcUrl = rtcUrl.replace(/rtc/, 'rrc');
			regexp = 'http.*' + rrcUrl + '.*showArtifact.*';
			if (tab.url.match(regexp)) {
				chrome.pageAction.setIcon({tabId: tabId, path: chrome.extension.getURL('fullscreen.png')});
				chrome.pageAction.setTitle({tabId: tabId, title: 'Go FullScreen!'});
				chrome.pageAction.show(tabId);
			}
		}
	});
}

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.pageAction.onClicked.addListener(function (activeTab) {
	getConfig(function (config) {
		var rtcUrl = config.rtcURL;
		var regexp = 'http.*' + rtcUrl + '.*runSavedQuery.*';
		if (activeTab.url.match(regexp)) {
			executeScripts(config, chrome.tabs, activeTab.id);
		} else if (config.rrcFullscreenIndicator === true) {
			var rrcUrl = rtcUrl.replace(/rtc/, 'rrc');
			regexp = 'http.*' + rrcUrl + '.*showArtifact.*';
			if (activeTab.url.match(regexp)) {
				chrome.tabs.executeScript(activeTab.id, {file: 'goFullscreen.js'});
			}
		}
	});
});

function executeScripts(config, ct, tId) {
	if (config.burndownIndicator === true) {
		ct.executeScript(tId, {file: 'd3.min.js'},
		ct.executeScript(tId, {file: 'sbd.js'},
		ct.executeScript(tId, {file: 'content_script.js'})));
	} else {
		ct.executeScript(tId, {file: 'content_script.js'});
	}
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	var msg = JSON.parse(request);
	if (msg.request === 'getSettings') {
		// Have to rely on the cache being accurate, cannot do another async call
		sendResponse(configCache);
	} else if (msg.request === 'loadCallback') {
		// Is the page in the callback list? if it is, return true, else return false
		callbacks[callbacks.length] = msg.url;
		sendResponse({added: true});
	} else if (msg.request === 'skipBuild') {
		skipBuild = true;
		sendResponse({added: true});
	}
});

// Upgrade versions
getConfig(function (config) {
	if (VERSION > config.version) {
		chrome.storage.sync.set({
			version: VERSION
		}, function () {
			chrome.runtime.openOptionsPage();
		});
	}

	if (config.version < 126) {
	chrome.notifications.create({
	type: 'basic',
	title: 'Build a Burndown Chart!!',
	message: 'Is your VMS board for an iteration? Would you like to see it in burndown chart form? Now you can!',
	iconUrl: 'icon-128.png'
	});
	}
});

// migrate from older versions using localStorage
if (localStorage.version) {
	var defaults = {
		rtcURL: '',
		pointsIndicator: false,
		burndownIndicator: false,
		rrcFullscreenIndicator: false
	};
	if (localStorage.rtcURL) {
		defaults.rtcURL = localStorage.rtcURL;
	}

	if (localStorage.pointsIndicator === 'true') {
		defaults.pointsIndicatorCheckbox = true;
	}

	if (localStorage.burndownIndicator === 'true') {
		defaults.burndownCheckbox = true;
	}

	if (localStorage.rrcFullscreenIndicator === 'true') {
		defaults.rrcFullscreenCheckbox = true;
	}

	chrome.storage.sync.set(defaults, function () {
		localStorage.clear();
	});
}
