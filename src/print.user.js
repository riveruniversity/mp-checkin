// ==UserScript==
// @name					Checkin Print
// @namespace			revival.com
// @version				1.0.0
// @description		MP Checkin Suite extension
// @author				River Church
// @match					https://mp.revival.com/checkin*
// @icon					https://mp.revival.com/checkin/content/images/app-logo.png
// @updateURL			https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/src/print.user.js
// @downloadURL		https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/src/print.user.js
// @inject-into 	page

// @grant 				none
// ==/UserScript==




/* eslint-disable no-undef */

// Store the original XMLHttpRequest constructor
const OriginalXHR = window.XMLHttpRequest;
const domParser = new DOMParser();

// Override XMLHttpRequest
window.XMLHttpRequest = function () {
  const xhr = new OriginalXHR();

  // Store the original open method
  const originalOpen = xhr.open;
  xhr.open = function (method, url, async, user, password) {
	// Log or store request details
	this._url = url; // Save URL for later evaluation
	this._method = method;
	console.log('XHR Request:', { method, url });

	return originalOpen.apply(this, arguments);
  };

  // Store the original send method
  const originalSend = xhr.send;
  xhr.send = function (body) {
	const jsonBody = JSON.parse(body || '{}');
	console.log('body', jsonBody);
	if (this._method === 'POST' && this._url.match(/api\/printService\/Print$/)) {
	  // Intercept the print request and handle it asynchronously
	  interceptPrint(body, this);
	  return; // Don't send the original request
	}

	return originalSend.apply(this, arguments);
  };

  return xhr;
};

/*
{
  "printServiceMachineName": "RMIFPS01",
  "printerName": "RegZD45",
  "configuration": {
    "SummaryEnabled": false,
    "Size": "label_10x1",
    "Orientation": "landscape",
    "Cutter": false
  },
  "labels": [
    {
      "LabelData": "",
      "Timestamp": "2025-07-17T02:22:38.743631Z",
      "Signature": "0AA83140060051E1B37C8499709CCD2E2AC47094"
    }
  ]
}
*/

async function interceptPrint(body, xhrInstance) {
  try {
	// Parse payload data and decode Base64 to HTML string
	const printConfig = JSON.parse(body);
	const labelData = printConfig.labels[0];
	const base64String = labelData.LabelData;
	const htmlString = atob(base64String);

	// Parse HTML
	const htmlDoc = domParser.parseFromString(htmlString, "text/html");
	const bodyElement = htmlDoc.querySelector("#labelBody");
	const htmlForm = bodyElement.querySelector('form.label-content');

	// Modify the HTML (e.g., change text in span#output)
	bodyElement.style.padding = '3px';
	//bodyElement.style.paddingLeft = '3px';    // 5px
	htmlForm.style.minWidth = '946px';        // 952px
	htmlForm.style.width = '946px';           // 952px
	htmlForm.style.height = '80px';

	// Serialize modified DOM to HTML string
	const serializer = new XMLSerializer();
	const modifiedHtml = serializer.serializeToString(htmlDoc);

	// Encode modified HTML to Base64
	const modifiedBase64 = btoa(modifiedHtml);

	console.log('Redirecting print job to Print Server...');

	// Send to your Print Server
	const response = await fetch('http://localhost:3000/api/print/submit', {
	  method: "POST",
	  headers: {
		'Content-Type': 'application/json'
	  },
	  body: JSON.stringify({
		"printerName": "ZDesigner ZD620",
		"htmlContent": modifiedBase64,
		"metadata": {
		  "ageGroup": "adult",
		  "priority": "high",
		  "copies": 1,
		  "paperSize": "A4",
		  "orientation": "landscape"
		}
	  })
	});

	const printServerResponse = await response.json();
	console.log('✅ Print Server Response:', printServerResponse);

	// Forward the Print Server response to the original XHR
	forwardResponse(xhrInstance, response.status, response.statusText, printServerResponse);

  } catch (error) {
	console.error('❌ Print interception failed:', error);

	// Send error response back to original XHR
	forwardErrorResponse(xhrInstance, error);
  }
}

function forwardResponse(xhrInstance, status, statusText, responseData) {
  // Set XMLHttpRequest properties to match the Print Server response
  Object.defineProperty(xhrInstance, 'readyState', { writable: true });
  Object.defineProperty(xhrInstance, 'status', { writable: true });
  Object.defineProperty(xhrInstance, 'statusText', { writable: true });
  Object.defineProperty(xhrInstance, 'responseText', { writable: true });
  Object.defineProperty(xhrInstance, 'response', { writable: true });

  xhrInstance.readyState = 4; // DONE
  xhrInstance.status = status;
  xhrInstance.statusText = statusText;
  xhrInstance.responseText = JSON.stringify(responseData);
  xhrInstance.response = xhrInstance.responseText;

  // Trigger the onreadystatechange event
  if (xhrInstance.onreadystatechange) {
	xhrInstance.onreadystatechange();
  }

  // Trigger load event if handler exists
  if (xhrInstance.onload) {
	xhrInstance.onload();
  }
}

function forwardErrorResponse(xhrInstance, error) {
  // Set XMLHttpRequest properties for error response
  Object.defineProperty(xhrInstance, 'readyState', { writable: true });
  Object.defineProperty(xhrInstance, 'status', { writable: true });
  Object.defineProperty(xhrInstance, 'statusText', { writable: true });
  Object.defineProperty(xhrInstance, 'responseText', { writable: true });
  Object.defineProperty(xhrInstance, 'response', { writable: true });

  xhrInstance.readyState = 4; // DONE
  xhrInstance.status = 500;
  xhrInstance.statusText = 'Internal Server Error';
  xhrInstance.responseText = JSON.stringify({
	success: false,
	error: error.message || 'Print service error'
  });
  xhrInstance.response = xhrInstance.responseText;

  // Trigger the onreadystatechange event
  if (xhrInstance.onreadystatechange) {
	xhrInstance.onreadystatechange();
  }

  // Trigger error event if handler exists
  if (xhrInstance.onerror) {
	xhrInstance.onerror();
  }
}

function base64ToString(base64) {
  return atob(base64);
}

