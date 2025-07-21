// ==UserScript==
// @name			    Checkin Scan
// @namespace	  	revival.com
// @version		  	1.2.14
// @description		MP Checkin Suite extension
// @author			  River Church
// @match		    	https://mp.revival.com/checkin*
// @icon		    	https://mp.revival.com/checkin/content/images/app-logo.png
// @updateURL	  	https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/code/scan.user.js
// @downloadURL		https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/code/scan.user.js
// @require 		  https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/lib/style.js
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
    modifyResultList();
    window.qrScanner.stop();
  }

  if (mutations.find((m) => m.target.className == 'viewArea' && m.addedNodes.length > 1)) {
    waitingForPageToLoad();
  }
}

async function waitingForPageToLoad() {
  const main = document.querySelector('.viewAreaMain');

  if (!main) {
    console.log('⏳ loading page content...');
    window.requestAnimationFrame(waitingForPageToLoad);
    return;
  }

  // Not Search Page
  if (!document.querySelector('.searchInput')) return;

  console.log('search page loaded');

  // Wait for QrScanner to be available
  if (typeof QrScanner === 'undefined') {
    console.log('⏳ waiting for QrScanner library...');
    window.requestAnimationFrame(waitingForPageToLoad);
    return;
  }

  addVideoCanvas();
  addFlipButton();
  addObserver();
  startCam();

  // style.lib
  addStyle();
  roundEdges();
}


function addVideoCanvas() {
  if (document.querySelector('#video-container')) return;

  window.video = document.createElement('video');
  window.video.id = 'qr-video';
  window.video.controls = false;
  window.video.muted = false;
  window.video.style.width = '100%';
  window.video.style.height = '100%';
  window.video.style.objectFit = 'cover';
  window.video.style.objectPosition = 'center';

  // Square video container
  const containerHeight = window.orient === 'landscape' ? window.screen.height : window.screen.width;
  const multiFactor = window.containerSize === 's' ? 0.9 : 0.4;
  const videoContainer = document.createElement('div');
  videoContainer.id = 'video-container';
  videoContainer.style.width = (containerHeight * multiFactor) + 'px';
  videoContainer.style.maxWidth = (containerHeight * multiFactor) + 'px';
  videoContainer.style.aspectRatio = '1 / 1';
  videoContainer.style.overflow = 'hidden';
  videoContainer.style.position = 'relative';
  videoContainer.style.margin = '0 auto';

  videoContainer.appendChild(window.video);

  const panel = document.querySelector('.search-input-panel');
  panel.parentElement.appendChild(videoContainer);
}


function addFlipButton() {

  if (document.querySelector('#flip-cam')) return;

  const buttonSet = document.querySelector('.row.button-set');
  const firstButton = buttonSet.firstElementChild.nextElementSibling;


  const buttonContainer = firstButton.cloneNode(true);
  buttonContainer.style.flex = '1';

  const flipButton = buttonContainer.firstElementChild;
  flipButton.id = 'flip-cam';
  flipButton.title = 'Flip Camera';
  flipButton.style.background = '#449ba6';
  flipButton.firstElementChild.className = 'left fas fa-camera';
  flipButton.lastChild.textContent = 'Flip Cam';
  flipButton.removeAttribute("ng-click");
  flipButton.addEventListener('click', () => flipCamera());

  buttonSet.appendChild(buttonContainer);
}



function startCam() {

  // Stop and destroy existing scanner if it exists
  if (window.qrScanner) {
    window.qrScanner.stop();
    window.qrScanner.destroy(); // Important: clean up the old instance
    window.qrScanner = null;
  }

  const savedCamId = localStorage.getItem('currentCamId');

  // Use 'environment' or 'user' as string literals, or a valid device ID
  let preferredCamera = 'environment'; // default

  if (savedCamId && savedCamId !== 'environment' && savedCamId !== 'user') {
    // Only use saved ID if it's a real device ID, not a string literal
    preferredCamera = savedCamId;
  }

  window.qrScanner = new QrScanner(window.video, handleScanResult, {
    returnDetailedScanResult: true,
    highlightScanRegion: true,
    highlightCodeOutline: true,
    preferredCamera: preferredCamera,
  });

  window.qrScanner.start()
    .then(() => QrScanner.listCameras(true))
    .then(cameras => {
      console.log('Available cameras:', cameras);
      localStorage.setItem('cameras', JSON.stringify(cameras.slice(0, 2)));
      updateCurrentCamInfo();
    })
    .catch(err => console.error('Failed to start scanner or list cameras:', err));
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

  if (cameraList.length < 2) {
    return console.warn('No cameras to flip');
  }

  const currentCamId = localStorage.getItem('currentCamId');

  // Find current camera index more reliably
  let currentCamIndex = cameraList.findIndex(cam =>
    cam.id === currentCamId || cam.deviceId === currentCamId
  );

  // If not found, start from beginning
  if (currentCamIndex === -1) currentCamIndex = 0;

  const nextCamIndex = (currentCamIndex + 1) % cameraList.length;
  const nextCam = cameraList[nextCamIndex];

  window.qrScanner.setCamera(nextCam.id)
    .then(() => {
      localStorage.setItem('currentCamIndex', nextCamIndex);
      localStorage.setItem('currentCamId', nextCam.id);
      console.log('Switched to camera:', nextCam);
    })
    .catch(err => console.error('Failed to switch camera:', err));
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
