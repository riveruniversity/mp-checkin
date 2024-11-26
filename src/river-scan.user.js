// ==UserScript==
// @name 					Advanced Checkin
// @namespace 		RMI
// @description 	River Church
// @version 			0.2.1
// @match 				https://mp.revival.com/checkin*

// @inject-into 	page
// ==/UserScript==



// @updateURL 		https://raw.githubusercontent.com/riveruniversity/mp-qrscanner/main/river-scan.user.js

// Global Vars
window.video = null;
window.observer = null;
window.qrScanner = null;

if (/checkin/.test(location.hash)) {
	addResources();
	waitingForPageToLoad();
}

function handleMutations(mutations) {
	if (mutations.find(({ target }) => target.id === 'scrollableResults'))
		modifyResultList();

	if (
		mutations.find(
			(m) => m.target.className == 'viewArea' && m.addedNodes.length > 1
		)
	)
		waitingForPageToLoad();
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
	startCam();
	addObserver();
}

function addVideoCanvas() {
	video = document.createElement('video');
	video.id = 'qr-video';
	video.controls = false;
	video.muted = false;
	//video.width  = 100%; //
	//video.height = 320;  // 👈️ in px
	video.style.width = '100%';
	video.style.height = '100%';

	const div = document.createElement('div');
	div.id = 'qr-wrapper';
	div.style.width = '40%';
	div.style.display = 'flex';
	div.style.flexDirection = 'column';
	div.style.margin = '0 auto';

	const button = document.createElement('button');
	button.id = 'flip-cam';
	button.innerText = 'Flip Camera';
	button.addEventListener('click', () => flipCamera());

	div.appendChild(video);
	div.appendChild(button);

	const panel = document.querySelector('.search-input-panel');
	panel.parentElement.appendChild(div);
}

function startCam() {
	const videoElem = document.querySelector('#qr-video');

	qrScanner = new QrScanner(video, handleScanResult, {
		returnDetailedScanResult: true,
		highlightScanRegion: true,
		highlightCodeOutline: true,
		preferredCamera: 'user',
	});

	qrScanner.start().then(() => {
		QrScanner.listCameras(true)
			.then((list) => localStorage.setItem('cameras', JSON.stringify(list)))
			.catch((error) => console.log('error', error));
	});
}

function flipCamera() {
	const cameraList = JSON.parse(localStorage.getItem('cameras'));
	const currentCam = localStorage.getItem('currentCam');

	console.log('currentCam');
	console.log(currentCam);

	if (currentCam == '0') {
		qrScanner.setCamera(cameraList[1].id);
		localStorage.setItem('currentCam', 1);
	} else {
		qrScanner.setCamera(cameraList[0].id);
		localStorage.setItem('currentCam', 0);
	}
}

function addObserver() {
	if (window.observer) return;

	window.observer = new MutationObserver(handleMutations);

	const config = { childList: true, subtree: true };
	const obj = document.querySelector('body');
	window.observer.observe(obj, config);
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

	qrScanner.stop();
	searchByScan(result.data);
}

function searchByScan(id) {
	const searchInput = document.querySelector('.searchInput');
	const searchButton = document.querySelector('.searchButton');

	// r document.execCommand('insertText', false, id);

	//const ctrl = angular.element(searchInput)
	//console.log(ctrl.scope())

	angular.element(searchInput).val(id).trigger('input');
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


function addResources() {
	addScript('https://unpkg.com/qr-scanner@1.4.2/qr-scanner.umd.min.js');
	addCss("https://fonts.googleapis.com", "preconnect");
	addCss("https://fonts.gstatic.com", "preconnect", true);
	addCss("https://fonts.googleapis.com/css2?family=Open+Sans&family=Overpass:ital,wght@0,100..900;1,100..900&display=swap", "stylesheet");
}



function modifyResultList() {
	qrScanner.stop();
	styleParticipants();
	insertImages();
}

async function insertImages() {
	const { currentHousehold } = window.angular.element(document.querySelector('div#scrollableResults')).scope().$parent;
	const { Participants } = currentHousehold;
	const res = await fetch(
		`https://mp.revival.com/checkin/api/household/get/${currentHousehold.HouseholdId}?_cb=${Date.now()}&getOtherAuth=0&localTime=${new Date().toISOString().split('.')[0]}` //2023-01-12T17:57:05
	);
	const json = await res.json();
	const { Members } = json;
	const rowElements = document.querySelectorAll('div.row.participant');

	for (const [i, participant] of Object.entries(Participants)) {
		const rowElement = rowElements[i];
		const { FileUniqueId } = Members.find(
			({ ContactId }) => ContactId === participant.ContactId
		);

		const img = document.createElement('img');
		img.style.height = '115px';
		if (FileUniqueId)
			img.src = `https://mp.revival.com/ministryplatformapi/files/${FileUniqueId}?$thumbnail=true`;
		else
			img.src = blankImage;
		rowElement.appendChild(img);
		rowElement.style.display = 'flex';
		rowElement.style.flexDirection = 'row-reverse';
		rowElement.style.alignItems = 'center';
	}
}


function styleParticipants() {

	const participantRows = document.querySelectorAll('div.row.participant');
	participantRows.forEach(row => {

		let recordRow = row.parentElement;
		recordRow.style.borderRadius = '10px';
		recordRow.style.overflow = 'hidden';
		recordRow.style.margin = '15px 5px';
		recordRow.style.flexGrow = '2';

		let gender = row.firstElementChild.innerText.match(/\(\w\)/)?.at(0);
		let color = gender == '(M)' ? 'steelblue' : gender == "(F)" ? '#c995d9' : "#e4e6e7";
		recordRow.style.borderLeft = '5px solid ' + color;
		row.style.background = '#aaa';

		row.nextElementSibling.style.background = 'aliceblue';
	});

	const scrollableResults = document.querySelector('#scrollableResults');
	scrollableResults.style.overflow = 'auto';
	scrollableResults.style.display = 'flex';
	scrollableResults.style.flexWrap = 'wrap';
	scrollableResults.style.overflow = 'auto';
	scrollableResults.style.alignContent = 'flex-start';
	scrollableResults.style.fontFamily = 'Open Sans';

	let newHeight = scrollableResults.clientHeight + (participantRows.length * 5);
	scrollableResults.style.height = newHeight + 'px';
}

// @require 		https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js

var blankImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAM1BMVEXk5ueutLfn6eqrsbTp6+zg4uOwtrnJzc/j5earsbW0uby4vcDQ09XGyszU19jd3+G/xMamCvwDAAAFLklEQVR4nO2d2bLbIAxAbYE3sDH//7WFbPfexG4MiCAcnWmnrzkjIRaD2jQMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMw5wQkHJczewxZh2lhNK/CBOQo1n0JIT74/H/qMV0Z7GU3aCcVPuEE1XDCtVLAhgtpme7H0s1N1U7QjO0L8F7llzGeh1hEG/8Lo7TUmmuSrOfns9xnGXpXxsONPpA/B6OqqstjC6Ax/0ujkNdYQQbKNi2k64qiiEZ+ohi35X+2YcZw/WujmslYewiAliVYrxgJYrdwUmwXsU+RdApUi83oNIE27YvrfB/ZPg8+BJETXnqh9CVzBbTQHgojgiCvtqU9thFJg/CKz3VIMKMEkIXxIWqIpIg2SkjYj+xC816mrJae2aiWGykxRNsW0UwiJghJDljYI5CD8GRiCtIsJxizYUPQ2pzItZy5pcisTRdk/a9m4amtNNfBuQkdVhSaYqfpNTSFGfb9GRIakrE2Pm+GFLaCQPqiu0OpWP+HMPQQcgQMiQprWXNmsVwIjQjYi/ZrhAqNTCgr2gu0Jnz85RSSjso0HkMFZ0YZjKkc26a/jlmh9JiDyDxi9oeorTYAzZkwwoMz19pzj9bnH/GP/+qbchjSGflneWYhtTuKdMOmNKZcJ5TjInQKcYXnESd/jQxy0ENpULTNGOGgxpap/oyw9pbUAqhfx2Dbkhovvfgz4iUzoM9+GlK6/Mh4q29hyC1mwro30hpVVLPF9wYQr71RazOeM5/cw81iBRD+A03aM9/C/obbrKjbYSpCmIVG3qT/Q8oeUo3Rz0IL7vI1tEbCB9pSiu8I/aV8x3Kg/BGWrWp4ZVs0nZfmAoEG4h/61yHYIJiFSl6Q0Vk6tTW1N8kYp8hdOkfHYYMXd2Qft+8CYwqYDSKvqIh+MCF8Wgca2u/cwdgeW3TtuVn6+1oBs3yLo5C2JpK6CvQzGpfUkz9UG/87gCsi5o2LIXolxN0FbwAsjOLEr+YJmXn7iR6N0BCt5p5cMxm7eAsfS+/CACQf4CTpKjzgkvr2cVarVTf96372yut7XLJ1sa7lv6VcfgYrWaxqr3Wlo1S6pvStr22sxOtTNPLzdY3nj20bPP+ejFdJYkLsjGLdtPBEbe/mr2bQKiXWJDroA+vtzc0p9aahuwqHMDYrQEXHEw9jwQl3drMpts9JBU1SdktPe5FBRdJQ6bwXBpa57ib2A8kukQDzMjh++Uo7Fo6Wd02Pkf4fknqoo4HtvAIjsqUcjx6DIPgWCaOML9rKI/oqD9/lgNrn+eF+p7j8tnzHBiR7+kdUGw/+V1Kzkc75mMy6U+FMaxjPibiM1U1uGM+puInHpmALZCgP4pt7i840MV8+0R1zPsRB6UTcqpizncYwZ89syDydfyWCwXB1l8/zRNGWbTG/GHKUm9AkxHMc/EGSk3z2+ArEhPEV5TUBLEvUGFcjEUH80J/jveTGOAJEljJbILWGQT3zRYiwuKsUXN1EEJAzBhRJFll7mBUG7KD8EqPkKekBREaL8hMDZLQSG6AQjtHPYmvTQnX0TtpC1SYCe2YdkkyLP3jj5BSbKiuR585eQhTgoje6yIb0Yb0C+mV6EYvebqw5SDy2WmubogZiF2AVxPC2FpDf8H2Q9QWo6IkjUxTWVEI3WY/wrCeSuqJ+eRWzXR/JXwgVjUMozbCOfoEZiSiKVGepqv5CJ8RyR4D7xBeamqa7z3BJ/z17JxuBPdv93d/a2Ki878MMAzDMAzDMAzDMAzDMF/KP09VUmxBAiI3AAAAAElFTkSuQmCC`;