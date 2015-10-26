// JavaScript Document
	document.getElementById("saveButton").addEventListener('click',save_options)

	if (localStorage["rtcURL"]){
		document.getElementById("rtcURL").value = localStorage["rtcURL"];
	}	

	if (localStorage["pointsIndicator"]=='true'){
		document.getElementById("pointsIndicatorCheckbox").checked = true;
	}	

	if (localStorage["burndownIndicator"]=='true'){
		document.getElementById("burndownCheckbox").checked = true;
	}	

	if (localStorage["rrcFullscreenIndicator"]=='true'){
		document.getElementById("rrcFullscreenCheckbox").checked = true;
	}	

	function save_options() {
		var name = document.getElementById("rtcURL");
		name.value = name.value.trim();
		localStorage["rtcURL"] = name.value;
		localStorage["pointsIndicator"] = document.getElementById('pointsIndicatorCheckbox').checked;
		localStorage["burndownIndicator"] = document.getElementById('burndownCheckbox').checked;
		localStorage["rrcFullscreenIndicator"] = document.getElementById('rrcFullscreenCheckbox').checked;

		var status = document.getElementById("status");
		status.innerHTML = "Settings saved successfully.";

		if (typeof statusTimer != "undefined") {
			status.innerHTML = "";
			setTimeout(function() {
				status.innerHTML = "Settings saved successfully.";
			}, 50);
			clearTimeout(statusTimer);
		}
		statusTimer = setTimeout(function() {
			status.innerHTML = "";
		}, 3000);
	}
	
