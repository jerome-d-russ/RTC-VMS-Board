var msg = new Object();
msg.request = "getSettings";
var vmsSettings = new Object();
chrome.runtime.sendMessage(JSON.stringify(msg), function(response) {
	vmsSettings = response;
	verifyItemsExist();
});

function verifyItemsExist() {
	(function waitForRows() {
		if (typeof(document.getElementsByClassName("status-message")[0]) == 'undefined' || document.getElementsByClassName("status-message")[0].style.display == "block"){
			setTimeout(waitForRows,500);
		} else {
			if (document.getElementsByClassName("visibleRow").length > 0) {
				checkForExistingVMS();
			} else {
				alert("There are no items to display!");
			}
		}
	})()
};

function checkForExistingVMS(){
	if (document.getElementById("vmsDiv")){
		deleteVMSBoard();
	} else {
		var itemsPerPage = document.getElementsByClassName("itemsPerPage")[0].children[0];
		if (itemsPerPage.value == "all"){
			buildVMSBoard();
		} else {
			itemsPerPage.value = itemsPerPage[itemsPerPage.length-1].value;
			itemsPerPage.dispatchEvent(new Event('change'));
			setTimeout(function waitForChange() {
				if (document.getElementsByClassName("status-message")[0].style.display == "block"){
					setTimeout(waitForChange,500);
				} else {
					buildVMSBoard();
				}
			}, 1000);
			if(itemsPerPage.value != "all"){
				alert('RTC Limit of 500 story cards hit!\nVMS Board will not contain all story cards!');
			}	
		}
	}	
};

function buildVMSBoard(){	
  regexp = /.*&buildVMS/i;
	winloc = window.location.toString();
  if (!winloc.match(regexp)) {
		chrome.runtime.sendMessage(JSON.stringify({"request":"skipBuild"}), function() {
			history.replaceState({}, "VMS Board", window.location + "&buildVMS");
		});
  }

	cols = document.getElementsByClassName("queryResultsTable")[0].children[0].children[1];
	var columns = new Object();
	for(i=0,end=cols.childNodes.length;i<end;i++){
		var col = cols.children[i];
		var text = "";
		if (col.classList.contains("headerColumnSorted")){
			text = col.children[0].children[0].textContent;
		} else {
			if (col.classList.contains("headerColumnUnsorted")){
				text = col.textContent;
			}
		}
		switch(text) {
			case "Id":
				columns.id = i;
				break;
			case "Owned By":
				columns.owner = i;
				break;
			case "Story Points":
				columns.pts = i;
				break;
			case "Summary":
				columns.summary = i;
				break;
			case "Status":
				columns.status = i;
				break;
			case "Blocked":
				columns.blocked = i;
				break;
			case "Resolution Date":
				columns.resolutionDate = i;
				break;
			case "Depends On":
				columns.dependsOn = i;
				break;
			case "Blocks":
				columns.blocks = i;
				break;
			case "Filed Against":
				columns.team = i;
				break;
			case "Planned For":
				columns.plannedFor = i;
				break;
		}
	};
	
	// URL For Testing: https://rtc.nwie.net/jazz/web/projects/Dev%20Center#action=com.ibm.team.workitem.runSavedQuery&id=_xoQlwK4vEeC1LvnjuDk1Mg
	if (columns.id && columns.owner && columns.pts && columns.summary && columns.status){		
		buildBaseVMSDiv();
		populateCards(columns);
		resize();	
	}else{
		var fields = ""
		if (!columns.id)
			fields = fields + "\nID";
		if (!columns.owner)
			fields = fields + "\nOwner";
		if (!columns.pts)
			fields = fields + "\nPoints";
		if (!columns.summary)
			fields = fields + "\nSummary";
		if (!columns.status)
			fields = fields + "\nStatus";
		alert("Missing the following fields:" + fields);
	}		
};

function populateCards(columns) {
	var totalPoints = 0;
	rows = document.getElementsByClassName("visibleRow");
	for(var i=0,end=rows.length;i<end;i++){
		var row = rows[i];
		if (columns.blocked){
			blocked = row.childNodes[columns.blocked].textContent;
		}else{
			blocked = "";
		}
		if (columns.team){
			team = row.childNodes[columns.team].textContent;
		}else{
			team = "";
		}
		if (columns.plannedFor){
			plannedFor = row.childNodes[columns.plannedFor].textContent;
		}else{
			plannedFor = "";
		}
		dependsOn = new Array();
		if (columns.dependsOn){
			dependsOnAnchors = row.childNodes[columns.dependsOn].getElementsByTagName("a");
			if (dependsOnAnchors) {
				for(var j=0;j<dependsOnAnchors.length;j++){
					dependsOn[dependsOn.length] = dependsOnAnchors[j].href; 
				}
			}
		}
		blocks = new Array();
		if (columns.blocks){
			blocksAnchors = row.childNodes[columns.blocks].getElementsByTagName("a");
			if (blocksAnchors) {
				for(var j=0;j<blocksAnchors.length;j++){
					blocks[blocks.length] = blocksAnchors[j].href; 
				}
			}
		}
		buildCard(row.childNodes[columns.id].textContent,
							row.childNodes[columns.owner].textContent,
							row.childNodes[columns.pts].textContent,
							row.childNodes[columns.summary].textContent,
							row.childNodes[columns.status].textContent,
							blocked,
							dependsOn,
							blocks,
							team,
							plannedFor);
		if (!isNaN(parseInt(row.childNodes[columns.pts].textContent))){
			totalPoints += parseInt(row.childNodes[columns.pts].textContent);
		}
	}
	for (var i = 0, cols = document.getElementsByClassName("vmsColumn").length; i < cols; i++){
			addPointsToHeader(i,totalPoints);
	}
	cards = document.getElementsByClassName("card");
	cardText = new Array();
	for (var i=0;i<cards.length;i++){
		cardText[i] = cards[i].innerText;
	}
					
};

function buildCard(id,owner,points,summary,status,blocked,dependsOn,blocks,team,plannedFor){
  var element;
  switch(status){
    case 'New':   
    case 'In Analysis':
    case 'Postpone':
    case 'Deferred':
    case 'Escalated':
    case 'Open':
      element = "backlog";
      break;
    case 'In Development':
    case 'In Progress':
      element = "dev";
      break;
    case 'In Test':
      element = "test";
      break;
    case 'Done':
    case 'Invalid':
    case 'Realized':
    case 'Closed':
    case 'Not Valid':
      element = "done";
      break;
		default:
			console.log("Not found: " + status);
			break;
  }

  a = document.createElement("a");
  a.href = "https://" + vmsSettings.rtcURL + "/jazz/web/projects/Dev%20Center#action=com.ibm.team.workitem.viewWorkItem&id=" + id;
  a.target = "_blank";

  var card = document.createElement("div");
	card.id = id;
  card.className = "card";
	if (blocked == "true"){
		iconUrl = chrome.extension.getURL("stop.svg"); 
		card.style.backgroundImage = "url('" + iconUrl + "')";
		card.style.backgroundRepeat = "no-repeat";
		card.style.backgroundSize = "contain";
		card.style.backgroundPositionX = "50%";
	}
	
	if (dependsOn.length > 0){
		var top = 25;
		for(var i = 0;i<dependsOn.length;i++){
			var regex = /id=(\d+)/
			var linkTo = regex.exec(dependsOn[i])[1];
			if (regex.exec(dependsOn[i]) == null) continue;
			var aLinkTo = document.createElement("a");
			aLinkTo.href = "https://" + vmsSettings.rtcURL + "/jazz/web/projects/Dev%20Center#action=com.ibm.team.workitem.viewWorkItem&id=" + linkTo;
  		aLinkTo.target = "_blank";
			var dependsOnDiv = document.createElement("div");
			dependsOnDiv.id = "dependency" + id + linkTo;
			dependsOnDiv.setAttribute('linkTo',linkTo);
			dependsOnDiv.className = "dependsOn";
			dependsOnDiv.style.backgroundColor = "orange";
			dependsOnDiv.style.width = "15px";
			dependsOnDiv.style.height = "4px";
			dependsOnDiv.style.position = "absolute";
			dependsOnDiv.style.top = top + "px";
			dependsOnDiv.style.right = "2px";
			dependsOnDiv.style.zIndex = "1";
			dependsOnDiv.style.backgroundRepeat = "no-repeat";
			dependsOnDiv.title = linkTo;
			dependsOnDiv.onmouseover = function(){ 
				if (document.getElementById(this.getAttribute("linkTo"))) {
					drawLine(this,document.getElementById(this.getAttribute("linkTo")));
				} else {
					this.style.border = "1px solid black";
				}
			};
			dependsOnDiv.onmouseout = function(){ 
				if (document.getElementById(this.getAttribute("linkTo"))) {
					if (document.getElementById("dependencyLine" + this.id)) {
						document.getElementById("dependencyLine" + this.id).remove(); 
					}
				} else {
					this.style.border = "";
				}
			};
			aLinkTo.appendChild(dependsOnDiv);
			card.appendChild(aLinkTo);
			top += 5;
		}
	}
	
	if (blocks.length > 0){
		var top = 25;
		for(var i = 0;i<blocks.length;i++){
			var regex = /id=(\d+)/
			if (regex.exec(blocks[i]) == null) continue;
			var linkTo = regex.exec(blocks[i])[1];
			var aLinkTo = document.createElement("a");
			aLinkTo.href = "https://" + vmsSettings.rtcURL + "/jazz/web/projects/Dev%20Center#action=com.ibm.team.workitem.viewWorkItem&id=" + linkTo;
  		aLinkTo.target = "_blank";
			var blocksDiv = document.createElement("div");
			blocksDiv.id = "dependency" + id + linkTo;
			blocksDiv.setAttribute('linkTo',linkTo);
			blocksDiv.className = "blocks";
			blocksDiv.style.backgroundColor = "blue";
			blocksDiv.style.width = "15px";
			blocksDiv.style.height = "4px";
			blocksDiv.style.position = "absolute";
			blocksDiv.style.top = top + "px";
			blocksDiv.style.left = "2px";
			blocksDiv.style.zIndex = "1";
			blocksDiv.style.backgroundRepeat = "no-repeat";
			blocksDiv.title = linkTo;
			blocksDiv.onmouseover = function(){ 
				if (document.getElementById(this.getAttribute("linkTo"))) {
					drawLine(this,document.getElementById(this.getAttribute("linkTo")));
				} else {
					this.style.border = "1px solid black";
				}
			};
			blocksDiv.onmouseout = function(){ 
				if (document.getElementById(this.getAttribute("linkTo"))) {
					if (document.getElementById("dependencyLine" + this.id)) {
						document.getElementById("dependencyLine" + this.id).remove(); 
					}
				} else {
					this.style.border = "";
				}
			};
			aLinkTo.appendChild(blocksDiv);
			card.appendChild(aLinkTo);
			top += 5;
		}
	}
  a.appendChild(card);

  pointsDiv = document.createElement("div");
  pointsDiv.className = "points";
	pointsDiv.style.float = "left";
	if (isNaN(points)){
		points = '[ _ ]';
		if(vmsSettings.pointsIndicator == 'true'){
			var pointImg = document.createElement("span");
			pointImg.id = "pointImg";
			var iconUrl = chrome.extension.getURL("pointing_finger.svg"); 
			pointImg.style.backgroundImage = "url('" + iconUrl + "')";
			pointImg.style.width = "inherit";
			pointImg.style.height = "80%";
			pointImg.style.position = "absolute";
			pointImg.style.top = "20px";
			pointImg.style.left = "0px";
			pointImg.style.opacity = ".4";
			pointImg.style.backgroundRepeat = "no-repeat";
			pointImg.style.backgroundSize = "contain";
			pointImg.style.cursor = "pointer";
			card.appendChild(pointImg);		
		}
	}
  pointsDiv.innerHTML = "<h5 style='margin-top:0px'>" + points + " pts</h5>";
  card.appendChild(pointsDiv);

  ownerDiv = document.createElement("div");
  ownerDiv.className = "ownerName";
	ownerDiv.style.float = "right";
  ownerDiv.innerHTML = "<h6 style='margin-top:0px'>" + owner + "</h6>";
  card.appendChild(ownerDiv);

  storyDiv = document.createElement("div");
  storyDiv.className = "story";
	storyDiv.style.clear = "both";
  storyDiv.innerHTML = id;
  card.appendChild(storyDiv);

  summaryDiv = document.createElement("div");
  summaryDiv.className = "summary";
  summaryDiv.innerHTML = summary;
  card.appendChild(summaryDiv);
	
	if (team > ""){
		var teamDiv = document.createElement("h5");
		teamDiv.style.float = "left";
		teamDiv.innerHTML = team;
		card.appendChild(teamDiv);
	}
	
	if (plannedFor > ""){
		var plannedForDiv = document.createElement("h5");
		plannedForDiv.style.float = "right";
		plannedForDiv.innerHTML = plannedFor;
		card.appendChild(plannedForDiv);
	}
	
  document.getElementById(element).appendChild(a);
};

function addPointsToHeader(index,totalPoints) {
	var points = document.getElementsByClassName("colDetail")[index].getElementsByClassName("points");
	var total = 0;
	for(var i=0;i<points.length;i++){
		var text = points[i].textContent;
		var regex = /(.*) pts/
		var pts = regex.exec(text)[1];
		if (isNaN(pts)){
			pts = 0;
		}
		total += parseInt(pts);	
	}
	var h1 = document.getElementsByClassName("hdr")[index].getElementsByTagName("h1")[0];
	//h1.textContent = h1.textContent + " ( " + total + " / " + Math.round((total/totalPoints)*100) + "%)";
	h1.textContent = h1.textContent + " ( " + total + " pts )";
	h1.setAttribute("header",h1.textContent);
	h1.setAttribute("percent",Math.round((total/totalPoints)*100) + " %");
	h1.onmouseenter = function(){ h1.textContent = h1.getAttribute("percent");};
	h1.onmouseleave = function(){ h1.textContent = h1.getAttribute("header");};
};

//determine necessary height of header row
function resize() {
  colHeight = document.getElementsByClassName("vmsColumn")[0].scrollHeight;
  hdrHeight = document.getElementsByClassName("hdr")[0].scrollHeight;
  dtlHeight = colHeight - hdrHeight;
/*document.styleSheets[0].deleteRule(0)*/
  for (var i = 0, max = document.styleSheets[0].cssRules.length; i < max; i++){
    if (document.styleSheets[0].cssRules[i].selectorText == ".container") {
      document.styleSheets[0].cssRules[i].style.height = dtlHeight + "px";
      break;      
    }
  }
};

function deleteVMSBoard() {
	regexp = /.*&buildVMS/i;
	winloc = window.location.toString();
	if (winloc.match(regexp)) {
		history.replaceState({}, "Query", winloc.substring(0,winloc.length-9));
	}
	window.onresize = null;
	window.onmousewheel = null;
	document.onkeydown = null;
	document.getElementById("vmsDiv").remove();
	document.getElementById("rtcStyle").remove();
	document.getElementById("vmsStyle").remove();
	document.getElementById("net-jazz-ajax-WorkbenchRoot").style.visibility = "visible";
};

function buildBaseVMSDiv() {
	var vmsStyle = document.createElement("style");
	vmsStyle.type = "text/css";
	vmsStyle.id = "vmsStyle";
	vmsStyle.innerHTML = ".containter { width: 100%; height: 100%; }"
								+ ".vmsColumn { width: 25%; height: 100%; float: left; text-align: center;" 
								+ "border: 1px solid black; -webkit-box-sizing:border-box;"
								+ "-moz-box-sizing: border-box; box-sizing: border-box; position: relative;"
								+ "background-color: lavender; }"
								+ ".card { border-radius: 10px; position: relative; background-color: white;"
								+ "padding: 1%; border: 2px solid black; height: auto; width: 88%; margin: 5%; }"
								+ ".story {color: grey; font-size: xx-large; font-weight: 900; }"
								+ ".summary { height: auto; }"
								+ ".points { top: 5px; left: 5px; color: blue; }"
								+ ".ownerName { top: 5px; right: 5px; color: blue; }"
								+ ".colDetail { overflow: auto; height: 94%; }";
	
	var rtcStyle = document.createElement("style");
	rtcStyle.id = "rtcStyle";
	rtcStyle.type = "text/css";
	rtcStyle.innerHTML = "html.jazz-ui { overflow-y: hidden; }"
								 + "html.jazz-ui body { min-width: 0px;}"
			 					 + "* { margin: 0px; padding: 0px; overflow: hidden;}"
								 + "a { text-decoration: none; color: black;}";
	
	var vmsDiv = document.createElement("div");
	vmsDiv.id = "vmsDiv";
	vmsDiv.style.position = "absolute";
	vmsDiv.style.left = "0px";
	vmsDiv.style.top = "0px";
	vmsDiv.style.width = "100%";
	vmsDiv.style.height = "100%";
	vmsDiv.innerHTML = '<div class="vmsColumn"><div class="hdr"><h1 style="font-size:2em;font-weight:bolder;margin:2px">Ready for Dev</h1><hr/></div><div id="backlog" class="colDetail"></div></div>' 
									 + '<div class="vmsColumn"><div class="hdr"><h1 style="font-size:2em;font-weight:bolder;margin:2px">In Dev</h1><hr/></div><div id="dev" class="colDetail"></div></div>'
									 + '<div class="vmsColumn"><div class="hdr"><h1 style="font-size:2em;font-weight:bolder;margin:2px">Test</h1><hr/></div><div id="test" class="colDetail"></div></div>'
									 + '<div class="vmsColumn"><div class="hdr"><h1 style="font-size:2em;font-weight:bolder;margin:2px">Done</h1><hr/></div><div id="done" class="colDetail"></div></div>';
	
	var closeImg = document.createElement("span");
	closeImg.id = "frameImg";
	iconUrl = chrome.extension.getURL("error_button.svg"); 
	closeImg.style.backgroundImage = "url('" + iconUrl + "')";
	closeImg.style.width = "25px";
	closeImg.style.height = "25px";
	closeImg.style.position = "absolute";
	closeImg.style.top = "5px";
	closeImg.style.right = "5px";
	closeImg.style.zIndex = "1";
	closeImg.style.backgroundRepeat = "no-repeat";
	closeImg.style.cursor = "pointer";
	closeImg.onclick = function(){
		deleteVMSBoard();
	}
	vmsDiv.appendChild(closeImg);		
	
	var refreshImg = document.createElement("span");
	refreshImg.id = "refreshImg";
	iconUrl = chrome.extension.getURL("refresh.svg"); 
	refreshImg.style.backgroundImage = "url('" + iconUrl + "')";
	refreshImg.style.width = "25px";
	refreshImg.style.height = "25px";
	refreshImg.style.position = "absolute";
	refreshImg.style.top = "5px";
	refreshImg.style.left = "5px";
	refreshImg.style.zIndex = "1";
	refreshImg.style.backgroundRepeat = "no-repeat";
	refreshImg.style.cursor = "pointer";
	refreshImg.onclick = function(){
		var msg = new Object();
		msg.request = "loadCallback";
		msg.url = document.URL;
		chrome.runtime.sendMessage(JSON.stringify(msg), function(response) {
			vmsSettings = response;
			if (vmsSettings.added == true){
				location.reload();
			}			
		});
	}
	vmsDiv.appendChild(refreshImg);		
	
	bodyTag = document.getElementsByTagName("body")[0];
	bodyTag.style.position = "absolute";
	bodyTag.style.width = "100%";
	bodyTag.style.height = "100%";
	bodyTag.appendChild(vmsDiv);
	bodyTag.appendChild(vmsStyle);
	bodyTag.appendChild(rtcStyle);
	
	document.getElementById("net-jazz-ajax-WorkbenchRoot").style.visibility = "hidden";	
	
	document.onkeydown = function(evt) {
		evt = evt || window.event;
		if (evt.keyCode == 27){
			for (var i=0;i<cards.length;i++){
				cards[i].style.display = 'block';
			}
			if(document.getElementById("tbDiv")){
				document.getElementById("tbDiv").remove();
			}
		}
		//ctrl+alt+d
		else if (evt.ctrlKey && evt.altKey && evt.keyCode == 68) {
			showDependencies();				
		}
		//ctrl+alt+p
		else if (evt.ctrlKey && evt.altKey && evt.keyCode == 80) {
			showPercentages();				
		}
		//ctrl or alt
		else if (evt.ctrlKey || evt.altKey){}
		//Any other key press
		else {
			if(!document.getElementById("tbDiv")){
				var tbDiv = document.createElement("Div");
				document.getElementById("vmsDiv").appendChild(tbDiv);
				tbDiv.id = "tbDiv";
				tbDiv.style.backgroundColor = "rgba(50,50,50,.5)";
				tbDiv.style.position = "absolute";
				tbDiv.style.top = "0px";
				tbDiv.style.right = "0px";
				tbDiv.style.width = "100%";
				tbDiv.style.height = document.getElementsByClassName("hdr")[0].clientHeight + "px";
				
				var tb = document.createElement("input");
				tb.type = "textbox";
				tb.style.position = "absolute";
				tb.style.top = "5px";
				tb.style.right = "45%";
				tb.style.width = "10%";
				tb.onkeyup = function(){
					if (this.value == ""){
						for (var i=0;i<cards.length;i++){
							cards[i].style.display = 'block';
						}
						this.parentNode.remove();
					}else{
						rgx = new RegExp(this.value,"i");
						for (var i=0;i<cardText.length;i++){
							if (rgx.test(cardText[i])) {
								cards[i].style.display = 'block';
							}else{
								cards[i].style.display = 'none';
							}
						}
					}
				}
				tbDiv.appendChild(tb);						
				tb.focus();	
			}
		}
	};

	window.onmousewheel = function(){
		var dependents = document.getElementsByClassName("dependencyLine");
		var redraw = false;
		while (dependents[0]){
			dependents[0].remove();
			redraw = true;
		}
		if (redraw){
			drawDependencies();
		}
	};

	window.onresize = resize;
};

function drawDependencies() {
	var dependents = document.getElementsByClassName("dependsOn");
	for (var i=0;i<dependents.length;i++){
		if (document.getElementById(dependents[i].getAttribute("linkTo"))) {
			drawLine(dependents[i],document.getElementById(dependents[i].getAttribute("linkTo")));
		}	
	}
};

function showDependencies() {
	drawDependencies();
	setTimeout(function(){
		var dependents = document.getElementsByClassName("dependencyLine");
		while (dependents[0]){
			dependents[0].remove();
		}
	}, 5000);
};

function showPercentages() {
	var columns = document.getElementsByClassName("hdr");
	for (var i=0;i<columns.length;i++){
		var element = columns[i].getElementsByTagName("h1")[0];
		if (element) {
			element.textContent = element.getAttribute("percent");
		}	
	}
	setTimeout(function(){
		var columns = document.getElementsByClassName("hdr");
		for (var i=0;i<columns.length;i++){
			var element = columns[i].getElementsByTagName("h1")[0];
			if (element) {
				element.textContent = element.getAttribute("header");
			}	
		}
	}, 5000);
};

// from http://stackoverflow.com/questions/4270485/drawing-lines-on-html-page
function drawLine(from,to){	
	
	var pos = getPos(from);
	var x1 = pos.x + (from.clientWidth/2);
	var y1 = pos.y + (from.clientHeight/2);
	
	var pos = getPos(to);
	var x2 = pos.x + (to.clientWidth/2);
	var y2 = pos.y + (to.clientHeight/2);
	
	var offsets = from.getBoundingClientRect();
	var x1 = offsets.left + (from.clientWidth/2);
	var y1 = offsets.top + (from.clientHeight/2);
	
	var offsets = to.getBoundingClientRect();
	var x2 = offsets.left + (to.clientWidth/2);
	var y2 = offsets.top + (to.clientHeight/2);
	
	if(y1 < y2){
			var pom = y1;
			y1 = y2;
			y2 = pom;
			pom = x1;
			x1 = x2;
			x2 = pom;
	}

	var a = Math.abs(x1-x2);
	var b = Math.abs(y1-y2);
	var c;
	var sx = (x1+x2)/2 ;
	var sy = (y1+y2)/2 ;
	var width = Math.sqrt(a*a + b*b ) ;
	var x = sx - width/2;
	var y = sy;

	a = width / 2;
	c = Math.abs(sx-x);
	b = Math.sqrt(Math.abs(x1-x)*Math.abs(x1-x)+Math.abs(y1-y)*Math.abs(y1-y) );

	var cosb = (b*b - a*a - c*c) / (2*a*c);
	var rad = Math.acos(cosb);
	var deg = (rad*180)/Math.PI

	var div = document.createElement("div");
	div.id = "dependencyLine" + from.id;
	div.className = "dependencyLine";
	div.style.borderWidth = "2px";
	div.style.borderStyle = "solid";
	div.style.borderColor = from.style.backgroundColor;
	div.style.width = width + "px";
	div.style.height = "0px";
	div.style.position = "absolute";
	div.style.top = y + "px";
	div.style.left = x + "px";
	div.style.transform = "rotate(" + deg + "deg)";
	
	document.getElementById("vmsDiv").appendChild(div);
};
// from http://stackoverflow.com/questions/288699/get-the-position-of-a-div-span-tag
function getPos(el) {
	for (var lx=0, ly=0;
			 el != null;
			 lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
	return {x: lx,y: ly};
}