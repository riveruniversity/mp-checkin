// ==UserScript==
// @name 			River ID Scanner
// @namespace 		RIDS
// @description 	River Church
// @version 		0.0.2
// @updateURL 		https://raw.githubusercontent.com/riveruniversity/mp-qrscanner/main/river-scan.js
// @match 			https://mp.revival.com/*
// @exclude-match: 	*://*.*
// @inject-into 	page
// @grant       none

// ==/UserScript==

// @require 		https://unpkg.com/qr-scanner@1.4.1/qr-scanner-worker.min.js
// @require 		https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js

// @require 		https://unpkg.com/jsqr@1.4.0/dist/jsQR.js


(function addScript() {	console.log("adding scanner")
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js';

const head = document.querySelector("head");

	if (!head) {
		console.log("⏳ loading head...");
		window.requestAnimationFrame(addScript);
		return;
	}

  head.appendChild(script);
  
	console.log("scanner added")

})()


// Global Vars
window.video = null;
window.observer = null;
window.qrScanner = null;


waitingForPageToLoad();


function waitingForPageToLoad() {
	const main = document.querySelector(".viewAreaMain");

	if (!main) {
		console.log("⏳ loading page content...");
		window.requestAnimationFrame(waitingForPageToLoad);
		return;
	}
	
	// stop camera in background before starting again
	

	//* Page Loaded *//

    // Not Search Page
    const searchInput = document.querySelector(".searchInput");
    if (!searchInput) return;
    
	console.log("search page loaded");


	addVideoCanvas();
    startCam();
	addObserver();
}


function addVideoCanvas() {

	video = document.createElement("video");
	video.id = "qr-video";
	video.controls = false;
	video.muted = false;
	//video.height = 320; // 👈️ in px
	//video.width = 320; // 👈️ in px
	video.style.width = '100%';
	video.style.height = '320px';
	video.style.margin = '0 auto';

	const panel = document.querySelector(".search-input-panel");
	panel.appendChild(video);
}


function startCam() {
	
	//🚧 if(!videoInputDevices.length) alert('Please allow Safari to access your camera.')
	//🚧 const selectedDeviceId = videoInputDevices[1].deviceId;
	//🚧 console.log(`Started decode from camera with id ${selectedDeviceId}`);
	
	const videoElem = document.querySelector("#qr-video");

  qrScanner = new QrScanner(
		video,
		handleScanResult,
		{ returnDetailedScanResult: true }
	);

  qrScanner.start();
}


function addObserver() {

    if(window.observer) return;

    window.observer = new MutationObserver((mutations) => {

		for (let m of mutations)
			if (m.target.className == "viewArea" && m.addedNodes.length > 1)
				waitingForPageToLoad();
	});

	const config = { childList: true, subtree: true };
	const obj = document.querySelector("body");
	window.observer.observe(obj, config);
}


function handleScanResult (result) {
	
	console.log(result)
  alert(result.data)
  
	/*
	video.srcObject.getTracks().forEach((track) => {

        track.stop();

    });
    */
  
  qrScanner.stop();
  searchByScan(result.data);
}


function searchByScan(id) {
	
	const searchInput = document.querySelector(".searchInput");
	const searchButton = document.querySelector(".searchButton"); 
	
	// r document.execCommand('insertText', false, id);
	
	//const ctrl = angular.element(searchInput)
	//console.log(ctrl.scope())
	
	angular.element(searchInput).val(id).trigger('input');
	
	searchButton.click();
}
