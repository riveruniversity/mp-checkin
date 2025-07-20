// ==UserScript==
// @name					Checkin Print
// @namespace			revival.com
// @version				1.0.4
// @description		MP Checkin Suite extension
// @author				River Church
// @match					https://mp.revival.com/checkin*
// @icon					https://mp.revival.com/checkin/content/images/app-logo.png
// @updateURL			https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/src/print.user.js
// @downloadURL		https://raw.githubusercontent.com/riveruniversity/mp-checkin/main/src/print.user.js

// @grant 				none
// ==/UserScript==

// @inject-into 	page


console.log('🖨️  loading print module ...');



/* eslint-disable no-undef */

// initiatePrinters();

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
      interceptPrint(jsonBody, this);
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


function generateLabelData(base64Label, requestKiosk, i) {

  // Parse payload data and decode Base64 to HTML string
  const htmlString = atob(base64Label);

  // Find mp group
  const { groupId, labelName, summary, type } = extractKeyValue(htmlString);
  const participant = window.participants[i];
  // Identify Group Label by checking if Group ID is in our expexted group list and lable has that group active
  const mpGroup = window.mpGroups.find(group => participant.Events.some(({ GroupId }) => GroupId == group.id) && groupId?.includes(String(group.id)));

  // Assign kiosk printer by age group
  const kiosk = window.kiosks.find(k => k.group === requestKiosk?.group && (k.ageGroup == mpGroup?.name || k.ageGroup == mpGroup?.name?.replace('Bears', 'Kids')));

  // Parse HTML
  const htmlDoc = domParser.parseFromString(htmlString, "text/html");
  const bodyElement = htmlDoc.querySelector("#labelBody");
  const htmlForm = bodyElement.querySelector('form.label-content');

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
  const modifiedBase64 = btoa(modifiedHtml);

  const labelSize = kiosk.media === 'Wristband' ?
    { width: '10in', height: '1in', orientation: 'landscape' } :
    { width: '3in', height: '2in', orientation: 'landscape' };

  return {
    htmlContent: modifiedBase64,
    printerName: kiosk?.printer,
    printMedia: kiosk?.media,
    userId: participant.ContactId,
    name: participant.DisplayName,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    copies: 1,
    mpGroup,
    ...labelSize,
  };
}

async function interceptPrint(body, xhrInstance) {
  try {
    const { printServiceMachineName, printerName, configuration, labels } = body;
    const kiosk = window.kiosks.find(k => k.printer === printerName);
    const mappedLabels = labels.map((label, i) => generateLabelData(label.LabelData, kiosk, i));

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
        "labels": mappedLabels,
        "metadata": {
          "priority": "high",
          //"paperSize": "A4",

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

async function initiatePrinters() {
  fetch('https://mp.revival.com:8443/api/print/printers')
    .then(res => res.json()).then(({ success, data }) => {
      console.log({ success }, data);
      success && (window.printers = data.printers);
    })
    .catch(err => console.error(err));
}



window.mpGroups = [
  { id: 571, name: 'Pastor' },
  { id: 490, name: 'Staff' },
  { id: 491, name: 'Contractor' },
  { id: 499, name: 'Student' },
  { id: 536, name: 'Alumni' },
  { id: 498, name: 'RMIMA' },
  { id: 410, name: 'Nursery', print: false }, // print upstairs
  { id: 411, name: 'Bears', print: 'Wristband' },
  { id: 412, name: 'Kids', print: 'Wristband' },
  { id: 485, name: 'Youth', print: 'Wristband' },
  { id: 550, name: 'Adults', print: 'Label' },
  { id: 522, name: 'Minors', print: 'Label' },
];



window.kiosks = [
  {
    "name": "A1",
    "section": "A",
    "position": 1,
    "group": "AB",
    "printer": "RegZD24",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "A2",
    "section": "A",
    "position": 2,
    "group": "AB",
    "printer": "NO PRINTER",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "A3",
    "section": "A",
    "position": 3,
    "group": "AB",
    "printer": "RegZD53",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "A4",
    "section": "A",
    "position": 4,
    "group": "AR",
    "printer": "RegZD40",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "A5",
    "section": "A",
    "position": 5,
    "group": "AR",
    "printer": "RegZD31",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "A6",
    "section": "A",
    "position": 6,
    "group": "AR",
    "printer": "RegZD46",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "A7",
    "section": "A",
    "position": 7,
    "group": "AT",
    "printer": "RKZebra2",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "A8",
    "section": "A",
    "position": 8,
    "group": "AT",
    "printer": "RegZD11",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "A9",
    "section": "A",
    "position": 9,
    "group": "AT",
    "printer": "RiverBearsZebra",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "A10",
    "section": "A",
    "position": 10,
    "group": "AL",
    "printer": "RegZD50",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "A11",
    "section": "A",
    "position": 11,
    "group": "AL",
    "printer": "RegZD37",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "A12",
    "section": "A",
    "position": 12,
    "group": "AL",
    "printer": "RegZD52",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "AT1",
    "section": "A",
    "position": 1,
    "group": "AC",
    "printer": "RegZD51",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "AT2",
    "section": "A",
    "position": 2,
    "group": "AC",
    "printer": "RKZebra4",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "B1",
    "section": "B",
    "position": 1,
    "group": "BB",
    "printer": "RegZD47",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "B2",
    "section": "B",
    "position": 2,
    "group": "BB",
    "printer": "RegZD70",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "B3",
    "section": "B",
    "position": 3,
    "group": "BB",
    "printer": "RegZD61",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "B4",
    "section": "B",
    "position": 4,
    "group": "BR",
    "printer": "RegZD41",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "B5",
    "section": "B",
    "position": 5,
    "group": "BR",
    "printer": "RegZD35",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "B6",
    "section": "B",
    "position": 6,
    "group": "BR",
    "printer": "RegZD55",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "B7",
    "section": "B",
    "position": 7,
    "group": "BT",
    "printer": "RegZD65",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "B8",
    "section": "B",
    "position": 8,
    "group": "BT",
    "printer": "RegZD62",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "B9",
    "section": "B",
    "position": 9,
    "group": "BT",
    "printer": "RKZebra1",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "B10",
    "section": "B",
    "position": 10,
    "group": "BL",
    "printer": "RegZD26",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "B11",
    "section": "B",
    "position": 11,
    "group": "BL",
    "printer": "RegZD36",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "B12",
    "section": "B",
    "position": 12,
    "group": "BL",
    "printer": "RegZD43",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "BT1",
    "section": "B",
    "position": 1,
    "group": "BC",
    "printer": "RegZD1",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "BT2",
    "section": "B",
    "position": 2,
    "group": "BC",
    "printer": "RegZD4",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "C1",
    "section": "C",
    "position": 1,
    "group": "CB",
    "printer": "RegZD59",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "C2",
    "section": "C",
    "position": 2,
    "group": "CB",
    "printer": "RegZD66",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "C3",
    "section": "C",
    "position": 3,
    "group": "CB",
    "printer": "RegZD23",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "C4",
    "section": "C",
    "position": 4,
    "group": "CR",
    "printer": "RegZD60",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "C5",
    "section": "C",
    "position": 5,
    "group": "CR",
    "printer": "RegZD44",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "C6",
    "section": "C",
    "position": 6,
    "group": "CR",
    "printer": "RegZD39",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "C7",
    "section": "C",
    "position": 7,
    "group": "CT",
    "printer": "RegZD67",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "C8",
    "section": "C",
    "position": 8,
    "group": "CT",
    "printer": "RegZD69",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "C9",
    "section": "C",
    "position": 9,
    "group": "CT",
    "printer": "RegZD68",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "C10",
    "section": "C",
    "position": 10,
    "group": "CL",
    "printer": "RegZD54",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "C11",
    "section": "C",
    "position": 11,
    "group": "CL",
    "printer": "RegZD48",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "C12",
    "section": "C",
    "position": 12,
    "group": "CL",
    "printer": "RegZD30",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "CT1",
    "section": "C",
    "position": 1,
    "group": "CC",
    "printer": "RegZD3",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "CT2",
    "section": "C",
    "position": 2,
    "group": "CC",
    "printer": "RegZD12",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "D1",
    "section": "D",
    "position": 1,
    "group": "DB",
    "printer": "RegZD38",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "D2",
    "section": "D",
    "position": 2,
    "group": "DB",
    "printer": "NO PRINTER",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "D3",
    "section": "D",
    "position": 3,
    "group": "DB",
    "printer": "ZEBRA-NO NUMBER \"TEST REGULAR\"",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "D4",
    "section": "D",
    "position": 4,
    "group": "DR",
    "printer": "RegZD32",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "D5",
    "section": "D",
    "position": 5,
    "group": "DR",
    "printer": "RegZD21",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "D6",
    "section": "D",
    "position": 6,
    "group": "DR",
    "printer": "RegZD45",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "D7",
    "section": "D",
    "position": 7,
    "group": "DT",
    "printer": "NO PRINTER",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "D8",
    "section": "D",
    "position": 8,
    "group": "DT",
    "printer": "RegZD63",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "D9",
    "section": "D",
    "position": 9,
    "group": "DT",
    "printer": "RegZD64",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "D10",
    "section": "D",
    "position": 10,
    "group": "DL",
    "printer": "RegZD28",
    "ageGroup": "Youth",
    "media": "Wristband"
  },
  {
    "name": "D11",
    "section": "D",
    "position": 11,
    "group": "DL",
    "printer": "RegZD34",
    "ageGroup": "Adults",
    "media": "Wristband"
  },
  {
    "name": "D12",
    "section": "D",
    "position": 12,
    "group": "DL",
    "printer": "RegZD56",
    "ageGroup": "Kids",
    "media": "Wristband"
  },
  {
    "name": "DT1",
    "section": "D",
    "position": 1,
    "group": "DC",
    "printer": "RegZD5",
    "ageGroup": "Bears",
    "media": "Label"
  },
  {
    "name": "DT2",
    "section": "D",
    "position": 2,
    "group": "DC",
    "printer": "RegZD2",
    "ageGroup": "Bears",
    "media": "Label"
  }
];