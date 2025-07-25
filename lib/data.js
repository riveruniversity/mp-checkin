console.log('🗄️  loading data module ...');

window.mpGroups = [
  { id: 571, name: 'Pastor' },
  { id: 490, name: 'Staff' },
  { id: 491, name: 'Contractor' },
  { id: 499, name: 'Student' },
  { id: 536, name: 'Alumni' },
  { id: 498, name: 'RMIMA' },
  { id: 410, name: 'Nursery', print: false, ageGroup: true }, // print upstairs
  { id: 411, name: 'Bears', print: 'Wristband', ageGroup: true },
  { id: 412, name: 'Kids', print: 'Wristband', ageGroup: true },
  { id: 485, name: 'Youth', print: 'Wristband', ageGroup: true },
  { id: 550, name: 'Adults', print: 'Label', ageGroup: true },
  { id: 522, name: 'Minors', print: 'Label' },
];



window.kiosks = [];

/*

[
 {
   "name": "A1",
   "section": "A",
   "position": 1,
   "group": "AB",
   "printer": "NO PRINTER",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": false,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A2",
   "section": "A",
   "position": 2,
   "group": "AB",
   "printer": "NO PRINTER",
   "ageGroup": "Adults",
   "media": "Wristband",
   "status": false,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A3",
   "section": "A",
   "position": 3,
   "group": "AB",
   "printer": "NO PRINTER",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": false,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A4",
   "section": "A",
   "position": 4,
   "group": "AR",
   "printer": "RegZD40",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A5",
   "section": "A",
   "position": 5,
   "group": "AR",
   "printer": "RegZD31",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A6",
   "section": "A",
   "position": 6,
   "group": "AR",
   "printer": "RegZD46",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A7",
   "section": "A",
   "position": 7,
   "group": "AT",
   "printer": "RKZebra2",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A8",
   "section": "A",
   "position": 8,
   "group": "AT",
   "printer": "RegZebra11",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A9",
   "section": "A",
   "position": 9,
   "group": "AT",
   "printer": "RiverBearsZebra",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A10",
   "section": "A",
   "position": 10,
   "group": "AL",
   "printer": "RegZD50",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A11",
   "section": "A",
   "position": 11,
   "group": "AL",
   "printer": "RegZD37",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "A12",
   "section": "A",
   "position": 12,
   "group": "AL",
   "printer": "RegZD52",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "AT1",
   "section": "A",
   "position": 1,
   "group": "AC",
   "printer": "REG24",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "AT2",
   "section": "A",
   "position": 2,
   "group": "AC",
   "printer": "RegZD51",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B1",
   "section": "B",
   "position": 1,
   "group": "BB",
   "printer": "RegZD47",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B2",
   "section": "B",
   "position": 2,
   "group": "BB",
   "printer": "RegZD70",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B3",
   "section": "B",
   "position": 3,
   "group": "BB",
   "printer": "RegZD53",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B4",
   "section": "B",
   "position": 4,
   "group": "BR",
   "printer": "RegZD41",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B5",
   "section": "B",
   "position": 5,
   "group": "BR",
   "printer": "RegZD35",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B6",
   "section": "B",
   "position": 6,
   "group": "BR",
   "printer": "RegZD55",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B7",
   "section": "B",
   "position": 7,
   "group": "BT",
   "printer": "RegZD65",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B8",
   "section": "B",
   "position": 8,
   "group": "BT",
   "printer": "RegZD62",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B9",
   "section": "B",
   "position": 9,
   "group": "BT",
   "printer": "RKZebra1",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B10",
   "section": "B",
   "position": 10,
   "group": "BL",
   "printer": "RegZD26",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B11",
   "section": "B",
   "position": 11,
   "group": "BL",
   "printer": "RegZD36",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "B12",
   "section": "B",
   "position": 12,
   "group": "BL",
   "printer": "RegZD43",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "BT1",
   "section": "B",
   "position": 1,
   "group": "BC",
   "printer": "RegZebra4",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "BT2",
   "section": "B",
   "position": 2,
   "group": "BC",
   "printer": "RegZebra4",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C1",
   "section": "C",
   "position": 1,
   "group": "CB",
   "printer": "RegZD59",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C2",
   "section": "C",
   "position": 2,
   "group": "CB",
   "printer": "RegZD66",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C3",
   "section": "C",
   "position": 3,
   "group": "CB",
   "printer": "RegZD23",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C4",
   "section": "C",
   "position": 4,
   "group": "CR",
   "printer": "RegZD60",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C5",
   "section": "C",
   "position": 5,
   "group": "CR",
   "printer": "RegZD44",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C6",
   "section": "C",
   "position": 6,
   "group": "CR",
   "printer": "RegZD39",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C7",
   "section": "C",
   "position": 7,
   "group": "CT",
   "printer": "RegZD67",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C8",
   "section": "C",
   "position": 8,
   "group": "CT",
   "printer": "RegZD69",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C9",
   "section": "C",
   "position": 9,
   "group": "CT",
   "printer": "RegZD68",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C10",
   "section": "C",
   "position": 10,
   "group": "CL",
   "printer": "RegZD54",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C11",
   "section": "C",
   "position": 11,
   "group": "CL",
   "printer": "RegZD48",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "C12",
   "section": "C",
   "position": 12,
   "group": "CL",
   "printer": "RegZD30",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "CT1",
   "section": "C",
   "position": 1,
   "group": "CC",
   "printer": "RegZD75",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "CT2",
   "section": "C",
   "position": 2,
   "group": "CC",
   "printer": "RegZD75",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D1",
   "section": "D",
   "position": 1,
   "group": "DB",
   "printer": "RegZD38",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D2",
   "section": "D",
   "position": 2,
   "group": "DB",
   "printer": "RegZD42",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D3",
   "section": "D",
   "position": 3,
   "group": "DB",
   "printer": "TestReg",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D4",
   "section": "D",
   "position": 4,
   "group": "DR",
   "printer": "RegZD32",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D5",
   "section": "D",
   "position": 5,
   "group": "DR",
   "printer": "RegZD21",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D6",
   "section": "D",
   "position": 6,
   "group": "DR",
   "printer": "RegZD45",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D7",
   "section": "D",
   "position": 7,
   "group": "DT",
   "printer": "RegZebra12",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D8",
   "section": "D",
   "position": 8,
   "group": "DT",
   "printer": "RegZD63",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D9",
   "section": "D",
   "position": 9,
   "group": "DT",
   "printer": "RegZD64",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D10",
   "section": "D",
   "position": 10,
   "group": "DL",
   "printer": "RegZD28",
   "ageGroup": "Youth",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D11",
   "section": "D",
   "position": 11,
   "group": "DL",
   "printer": "RegZD34",
   "ageGroup": "Adults",
   "media": "Label",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "D12",
   "section": "D",
   "position": 12,
   "group": "DL",
   "printer": "RegZD56",
   "ageGroup": "Kids",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "DT1",
   "section": "D",
   "position": 1,
   "group": "DC",
   "printer": "RegZD73",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 },
 {
   "name": "DT2",
   "section": "D",
   "position": 2,
   "group": "DC",
   "printer": "RegZD73",
   "ageGroup": "Bears",
   "media": "Wristband",
   "status": true,
   "printerSettings": "",
   "orientation": ""
 }
]
 */