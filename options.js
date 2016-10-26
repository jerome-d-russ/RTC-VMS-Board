function restore_options() {
	chrome.storage.sync.get({
		rtcURL: '',
		pointsIndicator: false,
		burndownIndicator: false,
		rrcFullscreenIndicator: false
	}, function (options) {
		document.getElementById('rtcURL').value = options.rtcURL;
		document.getElementById('pointsIndicatorCheckbox').checked = options.pointsIndicator;
		document.getElementById('burndownCheckbox').checked = options.burndownIndicator;
		document.getElementById('rrcFullscreenCheckbox').checked = options.rrcFullscreenIndicator;
	});
}

function save_options() {
	var rtcURL = document.getElementById('rtcURL');
	chrome.storage.sync.set({
		rtcURL: rtcURL.value.trim(),
		pointsIndicator: document.getElementById('pointsIndicatorCheckbox').checked,
		burndownIndicator: document.getElementById('burndownCheckbox').checked,
		rrcFullscreenIndicator: document.getElementById('rrcFullscreenCheckbox').checked
	}, function () {
		var status = document.getElementById('status');
		status.textContent = 'Settings saved successfully.';

		if (typeof statusTimer !== 'undefined') {
			status.textContent = '';
			setTimeout(function () {
				status.textContent = 'Settings saved successfully.';
			}, 50);
			clearTimeout(statusTimer);
		}
		statusTimer = setTimeout(function () {
			status.textContent = '';
		}, 3000);
	});
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click', save_options);
