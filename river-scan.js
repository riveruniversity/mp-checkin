// ==UserScript==
// @name            River ID Scanner
// @namespace       RIDS
// @description     River Church
// @version         0.0.1
// @match           https://mp.revival.com/*
// @exclude-match:  *://*.*
// @inject-into     page
// @updateURL       https://raw.githubusercontent.com/riveruniversity/mp-qrscanner/main/river-scan.js
// @require         https://unpkg.com/@zxing/browser@0.1.1/umd/zxing-browser.min.js
// @require         https://cdn.jsdelivr.net/npm/eruda@2.5.0/eruda.js

// ==/UserScript==

/*
(function startScript() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://rawgit.com/sitepoint-editors/jsqrcode/master/src/qr_packed.js';
    document.body.appendChild(script);
    //var head = document.getElementsByTagName('head')[0];
    //if (head) head.appendChild(script);
    //else alert('head not found');
})()
*/

/*
GM.addElement('script', {
    src: 'https://rawgit.com/sitepoint-editors/jsqrcode/master/src/qr_packed.js',
    type: 'text/javascript'
  });
 */

// ? qrcode         ==> object
// ? window         ==> object
// ? window.qrcode  ==> undefined
// ? document       ==> object
// ? global         ==> undefined
// ? GM             ==> object

//alert('loading...')

window.video = null;
window.observer = null;


const codeReader = new ZXingBrowser.BrowserQRCodeReader();

addDevTools();

function addDevTools() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.jsdelivr.net/npm/eruda@2.5.0/eruda.js';
    window.document.body.appendChild(script);
	
	waitingForPageToLoad();
}



function waitingForPageToLoad() {
	const main = document.querySelector(".viewAreaMain");

    if(!window.eruda) {
		alert("⏳ loading dev tools...");
	    window.requestAnimationFrame(waitingForPageToLoad);
		return;
	}

    // At this point the eruda dev tools are attached to the window var
    //window.con = window.eruda.get('console');

	if (!main) {
		console.log("⏳ loading page content...");
		window.requestAnimationFrame(waitingForPageToLoad);
		return;
	}


	//* Page Loaded *//

    // Not Search Page
    const searchInput = document.querySelector(".searchInput");
    if (!searchInput) return;


	console.log("loaded");
    alert('page loaded')
	//setTimeout(() => alert("this " + typeof this), 2000);

	addVideoCanvas(main);
    startCam();
	addObserver();
}



function addVideoCanvas(area) {
	video = document.createElement("video");
	video.id = "qr-video";
	video.controls = false;
	video.muted = false;
	video.height = 320; // 👈️ in px
	video.width = 320; // 👈️ in px
	video.style.width = '320px';
	video.style.height = '320px';
	area.appendChild(video);
}


async function startCam() {
	const videoInputDevices = await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();

	const selectedDeviceId = videoInputDevices[1].deviceId;

	console.log(`Started decode from camera with id ${selectedDeviceId}`);
	
	const previewElem = document.querySelector("#qr-video");

	// you can use the controls to stop() the scan or switchTorch() if available
	const controls = await codeReader.decodeFromVideoDevice(
		selectedDeviceId,
		video,
		handleScanResult
	);

	// stops scanning after 20 seconds
	//setTimeout(() => controls.stop(), 2000);
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


function handleScanResult (result, error, controls) {
    // use the result and error values to choose your actions
    // you can also use controls API in this scope like the controls
    // returned from the method.
    
    if(error) return;
    
    console.log(result);
    searchByScan(result.getText());

    video.srcObject.getTracks().forEach((track) => {
        track.stop();
    });

    controls.stop();
    setTimeout(startCam, 1000);
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