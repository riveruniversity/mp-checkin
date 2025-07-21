// ==UserScript==
// @name					Checkin Print
// @namespace			revival.com
// @version				1.2.20
// @description		MP Checkin Suite extension
// @author				River Church
// @match					https://mp.revival.com/checkin*
// @icon					https://mp.revival.com/checkin/content/images/app-logo.png
// @updateURL			https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/code/print.user.js
// @downloadURL		https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/code/print.user.js
// @require 		  https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/lib/data.js
// @inject-into 	page
// @grant 				none
// ==/UserScript==

// @inject-into 	page


console.log('🖨️  loading print module ...');



/* eslint-disable no-undef */

initiateKiosks();

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

    if (this._method === 'POST' && this._url.match(/api\/label\/generate/)) {
      window.participants = jsonBody.selectedHouseholds[0].Participants;
    }
    else if (this._method === 'POST' && this._url.match(/api\/printService\/Print$/)) {
      // Intercept the print request and handle it asynchronously
      var { wristbands, onlyLabels } = interceptPrint(jsonBody);

      if (onlyLabels.labels.length && !wristbands.length) {
        return originalSend.apply(this, arguments);
      }
      else if (wristbands.length && !onlyLabels.labels.length) {
        printWristbands(wristbands, this, true);
        return; // Don't send the original request
      }
      else if (wristbands.length && onlyLabels.labels.length) {
        printWristbands(wristbands, this, false);
        arguments[0] = JSON.stringify(onlyLabels);
        return originalSend.apply(this, arguments);
      }
    }

    return originalSend.apply(this, arguments);
  };

  return xhr;
};


function interceptPrint(body) {

  const { printServiceMachineName, printerName, configuration, labels } = body;
  const kiosk = window.kiosks.find(k => k.printer === printerName);
  const mappedLabels = labels.map((label, i) => generateLabelData(label.LabelData, kiosk, i));

  const wristbands = mappedLabels.filter(label => !!label.htmlContent);
  const onlyLabels = {
    printServiceMachineName,
    printerName,
    configuration,
    labels: labels.reduce((acc, label, i) => mappedLabels.some(l => l.index === i) ? [...acc, label] : acc, [])
  };

  return { wristbands, onlyLabels };
}

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


function generateLabelData(base64Label, requestKiosk, index) {

  // Parse payload data, decode Base64 to HTML string, and parse HTML DOM
  const htmlString = atob(base64Label);
  const htmlDoc = domParser.parseFromString(htmlString, "text/html");
  const bodyElement = htmlDoc.querySelector("#labelBody");
  const htmlForm = bodyElement.querySelector('form.label-content');
  const isWristband = bodyElement.querySelector('input#labelType')?.value === 'Wristband';
  const participantId = bodyElement.querySelector('input#participantId')?.value;

  // Find mp group
  const { groupId, labelName, summary, type } = extractKeyValue(htmlString);

  // Retrieved generating labels
  const participant = window.participants.find(p => p.ParticipantId === Number(participantId));

  // Identify Group Label by checking if Group ID is in our expected group list // and label has that group active
  let mpGroup = window.mpGroups.filter(g => !!g.ageGroup).find(group => participant?.Events.some(({ GroupId }) => GroupId == group.id)); //&& groupId?.includes(String(group.id)
  const minorWaiver = groupId.includes('522');
  // Assign kiosk printer by age group
  const kiosk = window.kiosks.find(kiosk => kiosk.ageGroup == mpGroup?.name && (kiosk.group === requestKiosk?.group || (mpGroup?.name == 'Bears' && kiosk.section === requestKiosk.section)));

  if (!isWristband) return { print: !!mpGroup && !minorWaiver, index };

  // for validation on print server
  if(mpGroup) mpGroup = undefined;
  
  // Modify the HTML
  bodyElement.style.padding = '3px';
  //bodyElement.style.paddingLeft = '5px';
  htmlForm.style.minWidth = '946px'; // 952px
  htmlForm.style.width = '946px'; // 952px
  htmlForm.style.height = '80px';

  // Serialize modified DOM to HTML string
  const serializer = new XMLSerializer();
  const modifiedHtml = serializer.serializeToString(htmlDoc);

  // Encode modified HTML to Base64
  base64Label = btoa(modifiedHtml);

const labelSize = kiosk.media === 'Wristband' ?
  { width: '10in', height: '1in', orientation: kiosk.orientation, printerSettings: kiosk.printerSettings} :
  { width: '3in', height: '2in', orientation: kiosk.orientation, printerSettings: kiosk.printerSettings };



  return {
    htmlContent: base64Label,
    printerName: kiosk?.printer,
    printMedia: kiosk?.media,
    userId: participant.ContactId,
    name: participant.DisplayName,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    copies: 1,
    // mpGroup,
    ...labelSize,
  };
}

async function printWristbands(wristbands, xhrInstance, forward = false) {
  try {
    console.log('Redirecting print job to Print Server...');
    // Send to your Print Server
    const response = await fetch('https://mp.revival.com:8443/api/print/submit', {
      //const response = await fetch('https://10.0.1.16:8443/api/print/submit', {
      //const response = await fetch('http://localhost:8080/api/print/submit', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "labels": wristbands,
        "metadata": {
          "priority": "high",
          //"paperSize": "A4",

        }
      })
    });

    const printServerResponse = await response.json();
    console.log('✅ Print Server Response:', printServerResponse);

    // Forward the Print Server response to the original XHR
    forward && forwardResponse(xhrInstance, response.status, response.statusText, printServerResponse);

  } catch (error) {
    console.error('❌ Print interception failed:', error);

    // Send error response back to original XHR
    forward && forwardErrorResponse(xhrInstance, error);
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

function extractKeyValue(htmlString) {
  const commentRegex = /<!--([\s\S]*?)-->/;
  const keyValueRegex = /\[(.*?)=(.*?)\]/g;

  const match = commentRegex.exec(htmlString);
  if (!match) return {};

  const commentContent = match[1];
  const result = {};

  let kvMatch;
  while ((kvMatch = keyValueRegex.exec(commentContent)) !== null) {
    let key = kvMatch[1].trim();
    const value = kvMatch[2].trim();
    key = key.charAt(0).toLowerCase() + key.slice(1);
    result[key] = value;
  }

  return result;
}

async function checkMissingPrinters() {
  fetch('https://mp.revival.com:8443/api/print/printers')
    .then(res => res.json()).then(({ success, data }) => {
      console.log({ success }, data);
      success && (window.printers = data.printers);
      const notFound = window.kiosks.filter(k => !data.printers.some(p => p.name == k.printer));
      console.log('notFound', notFound)
    })
    .catch(err => console.error(err));
}


async function initiateKiosks() {
  const CACHE_KEY = 'mp_kiosks_data';
  // const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const CACHE_DURATION =  0; // 1min
  
  try {
    // Check localStorage first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      
      if (!isExpired) {
        window.kiosks = data;
        console.log('🖨️ Loaded kiosks from cache');
        return;
      }
    }
    
    // Fetch from API if not cached or expired
    const response = await fetch('https://mp.revival.com:8443/api/kiosks');
    const result = await response.json();
    
    if (Array.isArray(result)) {
      window.kiosks = result;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
      console.log('🖨️ Loaded kiosks from API');
    } else {
      console.warn('❌ Expected array from kiosks API, got:', typeof result);
      window.kiosks = []; // Fallback to empty array
    }
  } catch (error) {
    console.error('❌ Kiosk initialization failed:', error);
    window.kiosks = []; // Fallback to empty array
  }
}