// ==UserScript==
// @name			    Checkin Scan
// @namespace	  	revival.com
// @version		  	1.2.8
// @description		MP Checkin Suite extension
// @author			  River Church
// @match		    	https://mp.revival.com/checkin*
// @icon		    	https://mp.revival.com/checkin/content/images/app-logo.png
// @updateURL	  	https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/src/scan.user.js
// @downloadURL		https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/src/scan.user.js
// @inject-into 	page

// @grant 				none
// ==/UserScript==

// @inject-into 	page


console.log('🖼️ loading scan module ...');



/* eslint-disable no-undef */

// Global Vars
window.video = null;
window.scanObserver = null;
window.qrScanner = null;
window.orient = getScreenOrientation();


if (/checkin/.test(location.hash)) {
  addResources().then(waitingForPageToLoad);
}

function handleMutations(mutations) {
  if (mutations.find(({ target }) => target.id === 'scrollableResults')) {
    window.qrScanner.stop();
  }

  if (mutations.find((m) => m.target.className == 'viewArea' && m.addedNodes.length > 1)) {
    waitingForPageToLoad();
  }
}

function waitingForPageToLoad() {
  const main = document.querySelector('.viewAreaMain');

  if (!main) {
    console.log('⏳ loading page content...');
    window.requestAnimationFrame(waitingForPageToLoad);
    return;
  }

  //* Page Loaded *//

  // Not Search Page
  if (!document.querySelector('.searchInput')) return;

  console.log('search page loaded');


  addVideoCanvas();
  addObserver();
  startCam();
}


function addVideoCanvas() {
  window.video = document.createElement('video');
  window.video.id = 'qr-video';
  window.video.controls = false;
  window.video.muted = false;
  window.video.style.width = '100%';
  window.video.style.height = '100%';
  window.video.style.objectFit = 'cover';
  window.video.style.objectPosition = 'center';

  // Square video container (only contains the video)
  const videoContainer = document.createElement('div');
  videoContainer.id = 'video-container';
  videoContainer.style.width = '100%';
  videoContainer.style.aspectRatio = '1 / 1';
  videoContainer.style.overflow = 'hidden';
  videoContainer.style.position = 'relative';

  // Main wrapper div (contains video container + button)
  const div = document.createElement('div');
  div.id = 'qr-wrapper';
  div.style.width = window.containerWidth;
  div.style.maxWidth = (window.screen.height * 0.6) + 'px';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.margin = '0 auto';

  // Proper nesting: video goes in videoContainer, both go in main wrapper
  videoContainer.appendChild(window.video);
  div.appendChild(videoContainer);

  const panel = document.querySelector('.search-input-panel');
  panel.parentElement.appendChild(div);


  addFlipButton();
}


function addFlipButton() {

  const buttonSet = document.querySelector('.row.button-set');
  const firstButton = buttonSet.firstElementChild;


  const buttonContainer = firstButton.cloneNode(true);
  const flipButton = buttonContainer.firstElementChild;
  flipButton.id = 'flip-cam';
  flipButton.title = 'Flip Camera';
  flipButton.style.flex = '1';
  flipButton.firstElementChild.className = 'left fas fa-camera';
  flipButton.lastChild.textContent = 'Flip Cam';
  flipButton.removeAttribute("ng-click");
  flipButton.addEventListener('click', () => flipCamera());

  buttonSet.appendChild(buttonContainer);
}



function startCam() {
  const deviceId = localStorage.getItem('currentCamId') || 'environment';

  window.qrScanner = new QrScanner(window.video, handleScanResult, {
    returnDetailedScanResult: true,
    highlightScanRegion: true,
    highlightCodeOutline: true,
    preferredCamera: deviceId,
  });

  window.qrScanner.start()
    .then(() => QrScanner.listCameras(true))
    .then(list => localStorage.setItem('cameras', JSON.stringify(list)))
    .then(() => updateCurrentCamInfo())
    .catch(err => console.warn('Failed to start scanner or list cameras:', err));
}


function updateCurrentCamInfo() {
  const cameraList = JSON.parse(localStorage.getItem('cameras')) || [];

  const stream = window.qrScanner.$video.srcObject;
  if (!stream) {
    console.warn('Scanner not started yet');
    return;
  }

  const [track] = stream.getVideoTracks();
  const { deviceId, facingMode } = track.getSettings();
  localStorage.setItem('currentCamId', deviceId);

  const idx = cameraList.findIndex(c => c.deviceId === deviceId || c.id === deviceId);
  if (idx !== -1) {
    localStorage.setItem('currentCamIndex', idx);
  } else {
    console.warn('Active camera not in saved list');
  }
}

function flipCamera() {
  const cameraList = JSON.parse(localStorage.getItem('cameras')) || [];
  const currentCamId = localStorage.getItem('currentCamId');
  // const currentCamIndex = localStorage.getItem('currentCamIndex');

  if (cameraList.length < 2) {
    return console.warn('No cameras to flip');
  }

  const currentCamIndex = cameraList.findIndex(cam => cam.id == currentCamId);
  const nextCamIndex = cameraList[currentCamIndex + 1] ? currentCamIndex + 1 : 0;
  const nextCam = cameraList[nextCamIndex];

  window.qrScanner.setCamera(nextCam.id);
  localStorage.setItem('currentCamIndex', nextCamIndex);
  localStorage.setItem('currentCamId', nextCam.id);
}

function addObserver() {
  if (window.scanObserver) return;

  window.scanObserver = new MutationObserver(handleMutations);

  const config = { childList: true, subtree: true };
  const obj = document.querySelector('body');
  window.scanObserver.observe(obj, config);
}

function handleScanResult(result) {
  // camera reads randomly a blank code
  if (!result.data) {
    return;
  }

  console.log(result);
  //alert(result.data)

  /*
  video.srcObject.getTracks().forEach((track) => {

        track.stop();

    });
    */

  window.qrScanner.stop();
  searchByScan(result.data);
}

function searchByScan(id) {
  const searchInput = document.querySelector('.searchInput');
  const searchButton = document.querySelector('.searchButton');

  // r document.execCommand('insertText', false, id);

  //const ctrl = angular.element(searchInput)
  //console.log(ctrl.scope())

  window.angular.element(searchInput).val(id).trigger('input');
  searchButton.click();
}



function addScript(url) {
  console.log('adding scanner');

  const script = document.createElement('script');
  // script.type = 'text/javascript';
  script.type = 'module';
  script.src = url;
  const head = document.querySelector('head');

  head.appendChild(script);
  console.log('scanner added');
}


function addCss(href, rel = 'stylesheet', crossorigin = false) {

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (crossorigin) link.crossOrigin = true;

  document.querySelector('head').appendChild(link);
}


async function addResources() {
  addScript('https://unpkg.com/qr-scanner@1.4.2/qr-scanner.umd.min.js');
  addCss("https://fonts.googleapis.com", "preconnect");
  addCss("https://fonts.gstatic.com", "preconnect", true);
  addCss("https://fonts.googleapis.com/css2?family=Open+Sans&family=Overpass&display=swap", "stylesheet");
  await sleep(300);
}


function getScreenOrientation() {

  if (window.screen.orientation) {
    // Use Screen Orientation API if available
    const type = window.screen.orientation.type;
    window.orient = type.includes('portrait') ? 'portrait' : 'landscape';
  } else {
    // Fallback to window dimensions
    window.orient = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  window.containerSize = window.screen.width <= 420 ? 's' : window.orient === 'landscape' || window.screen.width <= 920 ? 'm' : 'l';
  window.containerWidth = window.containerSize === 's' ? '95%' : window.containerSize === 'm' ? '70%' : '50%';
  //window.containerWidth = window.orient === 'landscape' || window.screen.width >= 420 ? '40%' : '95%';

  console.log('orientation', window.orient);
  return window.orient;
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// @require 		https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js
