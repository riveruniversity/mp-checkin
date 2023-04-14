// ==UserScript==
// @name 			River ID Scanner
// @namespace 		RIDS
// @description 	River Church
// @version 		0.1.3
// @updateURL 		https://raw.githubusercontent.com/riveruniversity/mp-qrscanner/main/river-scan.js
// @match 			https://mp.revival.com/*
// @exclude-match: 	*://*.*
// @inject-into 	page
// @grant       none
// ==/UserScript==

// @require 		https://unpkg.com/qr-scanner@1.4.1/qr-scanner-worker.min.js
// @require 		https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js

// @require 		https://unpkg.com/jsqr@1.4.0/dist/jsQR.js


if (! /checkin/.test(location.hash)) return;

(function addScript() {
  console.log("adding scanner")

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
  //video.width  = 100%; //
  //video.height = 320;  // 👈️ in px
  video.style.width = '100%';
  video.style.height = '100%';


  const div = document.createElement('div');
	div.id = 'qr-wrapper'
	div.style.width = '40%';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.margin = '0 auto';

	const button = document.createElement('button');
	button.id = 'flip-cam'
  button.innerText = 'Flip Camera';
  button.addEventListener('click', () => flipCamera());


	div.appendChild(video);
	div.appendChild(button);

  const panel = document.querySelector(".search-input-panel");
	panel.parentElement.appendChild(div);
}


function startCam() {

  const videoElem = document.querySelector("#qr-video");

  qrScanner = new QrScanner(
    video,
    handleScanResult,
    {
      returnDetailedScanResult: true,
      highlightScanRegion: true,
      highlightCodeOutline: true
    }
  );

  this.qrScanner.start().then(() => {
    QrScanner.listCameras(true)
      .then((list) => localStorage.setItem("cameras", JSON.stringify(list)))
      .catch((error) => console.log('error', error))
  });
}


function flipCamera() {
  const cameraList = JSON.parse(localStorage.getItem("cameras"));
  const currentCam = localStorage.getItem("currentCam");
  
  console.log('currentCam')
  console.log(currentCam)
  

  if (currentCam == '0') {
    qrScanner.setCamera(cameraList[1].id);
    localStorage.setItem("currentCam", 1)
  }
  else {
    qrScanner.setCamera(cameraList[0].id);
    localStorage.setItem("currentCam", 0)
  }
}


function addObserver() {

  if (window.observer) return;

  window.observer = new MutationObserver((mutations) => {

    if (mutations.find(({ target }) => target.id === 'scrollableResults')) {
      insertImages();
    }

    for (let m of mutations)
      if (m.target.className == "viewArea" && m.addedNodes.length > 1)
        waitingForPageToLoad();
  });

  const config = { childList: true, subtree: true };
  const obj = document.querySelector("body");
  window.observer.observe(obj, config);
}


function handleScanResult(result) {

  qrScanner.stop();
  console.log(result)
  //alert(result.data)

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

async function insertImages() {

  const { currentHousehold } = window.angular.element(document.querySelector('div#scrollableResults')).scope().$parent;
  const { Participants } = currentHousehold;
  const res = await fetch(`https://mp.revival.com/checkin/api/household/get/${currentHousehold.HouseholdId}?_cb=1673564225607&getOtherAuth=0&localTime=2023-01-12T17:57:05`);
  const json = await res.json();
  const { Members } = json;
  const rowElements = document.querySelectorAll('div.row.participant');

  for (const [i, participant] of Object.entries(Participants)) {
    const rowElement = rowElements[i];
    const { FileUniqueId } = Members.find(({ ContactId }) => ContactId === participant.ContactId);
    if (FileUniqueId) {
      const img = document.createElement('img');
      img.src = `https://mp.revival.com/ministryplatformapi/files/${FileUniqueId}?$thumbnail=true`;
      rowElement.style.display = 'flex';
      rowElement.style.flexDirection = 'row-reverse';
      rowElement.style.alignItems = 'center';
      rowElement.appendChild(img);
    }
  }
}
