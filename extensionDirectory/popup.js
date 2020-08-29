let loadedMessage;

initListeners();

function initListeners() {
  // Listen to messages from the payload.js script and write to popout.html
  chrome.runtime.onMessage.addListener(function (rawDocketData) {
    let parsedData;
    switch (rawDocketData.domain) {
      // VT COURTS ONLINE
      case 'secure.vermont.gov': {
        parsedData = getVTCOPetitionerInfo(rawDocketData.rawDocket);
        break;
      }
      // ODYSSEY
      case 'publicportal.courts.vt.gov': {
        parsedData = getOdysseyPetitionerInfo(rawDocketData.rawDocket);
        break;
      }
      default: {
        // TODO: handle default case
      }
    }

    chrome.storage.local.get('counts', function (result) {
      combinedData = appendDataWithConfirmation(parsedData, result.counts);
      chrome.storage.local.set({
        counts: combinedData,
      });
    });
  });
  $('body').on('click', 'select.petitionSelect', function (event) {
    //prevents the select in the petition cards from opening the accordion.
    event.stopPropagation();
  });
}

function appendDataWithConfirmation(newData, oldData) {
  //if there is no old data, then the new data is what we'll use
  if (oldData === undefined) {
    return newData;
  }
  //if the petitioner is not the same, we'll use the old data
  if (!isSamePetitioner()) {
    return oldData;
  }

  var returnData = oldData;
  var newCounts = newData.counts;
  var totalNumMatchingExistingCounts = 0;
  for (count in newCounts) {
    var currentCount = newCounts[count];
    console.log(currentCount.uid);
    var numMatchingExistingCounts = oldData.counts.filter(
      (count) => count.uid === currentCount.uid
    ).length;
    if (numMatchingExistingCounts == 0) {
      returnData.counts.push(currentCount);
      totalNumMatchingExistingCounts += numMatchingExistingCounts;
    }
  }

  if (totalNumMatchingExistingCounts > 0) {
    alert(
      `${totalMatchCount} counts matched existing counts and were not added.`
    );
  }

  return returnData;

  function isSamePetitioner() {
    var oldName = oldData['defName'];
    var newName = newData['defName'];
    if (oldName != newName) {
      return confirm(
        `"The name on the counts you are trying to add is ${newName}, which is not the same as ${oldName}. Are you sure you want to continue?`
      );
    }
    return true;
  }
}

/**
 * This info is parsed out of the docket pages.
 */
class PetitionerInfo {
  constructor(name, dob, address = '', counts = []) {
    this.name = name; // defendent's name
    this.dob = dob; // defendent's date of birth
    this.address = address; // defendent's address (optional)
    this.counts = counts; // an array of petitioner counts (see class below)
  }
}

/**
 * Each count should contain these properties
 */
class PetitionerCounts {
  constructor(
    allegedOffenseDate,
    arrestCitationDate,
    countNum,
    county,
    description,
    dispositionDate,
    docketCounty,
    docketNum,
    docketSheetNum,
    filingType,
    guid,
    isDismissed,
    offenseClass,
    offenseDisposition,
    outstandingPayment,
    sectionNum,
    titleNum,
    uid
  ) {
    this.allegedOffenseDate = allegedOffenseDate; // eg: "2012-05-12"
    this.arrestCitationDate = arrestCitationDate; // eg: "2012-05-12"
    this.countNum = countNum; // eg: "1"
    this.county = county; // eg: "Chittenden"
    this.description = description; // eg: "DUI #1-INFLUENCE"
    this.dispositionDate = dispositionDate; // eg: "2012-06-27"
    this.docketCounty = docketCounty; // eg: "Cncr"
    this.docketNum = docketNum; // eg: "1899-5-12"
    this.docketSheetNum = docketSheetNum; // eg: "1899-5-12 Cncr"
    this.filingType = filingType; // eg: "X"
    this.guid = guid; // eg: "3abef45f-187d-b0e4-9e2c-969c158acded"
    this.isDismissed = isDismissed; // eg: true
    this.offenseClass = offenseClass; // eg: "mis"
    this.offenseDisposition = offenseDisposition; // eg: "Dismissed by state"
    this.outstandingPayment = outstandingPayment; // eg: false
    this.sectionNum = sectionNum; // eg: "1201(a)(2)"
    this.titleNum = titleNum; // eg: "23"
    this.uid = uid; // eg: "1899-5-12_Cncr11899-5-12Dismissed_by_state"
  }
}

/**
 * Parses Odyssey docket html and returns object with parsed data
 * @param {string} domString The html of the Odyssey docket
 */
function getOdysseyPetitionerInfo(domString) {
  const docket = $($.parseHTML(domString));
  let currentDocket = new PetitionerInfo();

  // defName: in form of "       \n        Last, First Middle\n         "
  const rawName = docket.find('.roa-party-row:last .roa-text-bold:last').text();
  currentDocket.name = rawName.trim();

  currentDocket.dob = '1980-01-01';
  currentDocket.address = '5 Main St.';
  currentDocket.counts = parseOdysseyCounts(docket);
  return currentDocket;
}

/**
 * Function to parse out the criminal counts visible on a docket
 * @param {jQuery obj} docket The Odyssey dom parsed as a jQuery object
 * @returns {array} An array of criminal count objects
 */
function parseOdysseyCounts(docket) {
  return [
    {
      allegedOffenseDate: '2012-05-12',
      arrestCitationDate: '2012-05-12',
      countNum: '1',
      county: 'Chittenden',
      description: 'DUI #1-INFLUENCE',
      dispositionDate: '2012-06-27',
      docketCounty: 'Cncr',
      docketNum: '1899-5-12',
      docketSheetNum: '1899-5-12 Cncr',
      filingType: 'X',
      guid: '3abef45f-187d-b0e4-9e2c-969c158acded',
      isDismissed: true,
      offenseClass: 'mis',
      offenseDisposition: 'Dismissed by state',
      outstandingPayment: false,
      sectionNum: '1201(a)(2)',
      titleNum: '23',
      uid: '1899-5-12_Cncr11899-5-12Dismissed_by_state',
    },
  ];
}

/**
 * Parses the VTCO docket data and returns object with parsed data
 * @param {string} rawData The content of the 'pre' element that VTCO uses to wrap it's docket info
 */
function getVTCOPetitionerInfo(rawData) {
  //Get Defendant Name
  nameLocation = nthIndex(rawData, 'Defendant:', 1) + 15;
  nameLocationEnd = nthIndex(rawData, 'DOB:', 1) - 40;
  defName = rawData.substring(nameLocation, nameLocationEnd);

  //Get Date of Birth
  dobLocation = nthIndex(rawData, 'DOB:', 1) + 15;
  dobLocationEnd = nthIndex(rawData, 'POB:', 1) - 40;
  defDOB = rawData.substring(dobLocation, dobLocationEnd);

  //Get Address
  try {
    //match all between address and next hearing
    addressString = rawData.match(/(?<=Address:)\s+.*(?=Next Hearing:)/gms);
    addressArray = addressString[0].split('\n');
    addressArray.pop();
    //trims off disposed text and excess spaces
    addressArray[1] = addressArray[1].match(/([ \t]{6,})(.*)/gms).toString();
  } catch {
    addressArray = [];
    addressArray[0] = 'No Address found';
  }

  for (i = 0; i < addressArray.length; i++) {
    addressArray[i] = addressArray[i].trim();
  }

  //get docket Num
  docketSheetNum = rawData.match(/([Docket No.\s+])(\d.*?cr)/)[0].trim();

  //create all counts object
  parsedData = {
    defName: defName,
    defDOB: parseDateFromDocket(defDOB),
    defAddress: addressArray.join('\n'),
    counts: getCountInfo(rawData),
  };

  return parsedData;
}

function getCountInfo(rawData) {
  divider =
    '================================================================================';

  //Determine Number of Counts and create array with each line count
  countsStart = nthIndex(rawData, divider, 2) + divider.length + 1;
  countsEnd = rawData.substring(countsStart).indexOf('=') + countsStart;
  allCountsBody = rawData.substring(countsStart, countsEnd);
  countTotal = (allCountsBody.match(/\n/g) || []).length / 2;
  countTotal = Math.ceil(countTotal);
  allCountsArray = allCountsBody.split('\n');

  //Move data from count table into objects
  countLines = countTotal * 2;

  var counts = [];
  for (i = 0; i < countLines; i++) {
    //Catch Line 1 (odd lines) of each count
    if ((i + 1) % 2 != 0) {
      countObject = {};
      processCountLine1(allCountsArray[i], i / 2, rawData);
    } else {
      //Catch Line 2 of each count
      description = allCountsArray[i].trim();
      console.log('description: ' + description);
      description = description.replace(/\//g, ' / ');
      description = description.replace(/\s\s/g, ' ');

      var parser = new DOMParser();
      var dom = parser.parseFromString(
        '<!doctype html><body>' + description,
        'text/html'
      );
      var decodedString = dom.body.textContent;

      console.log(decodedString);
      countObject['description'] = decodedString;

      counts.push(countObject);
    }
  }
  return counts;
}

//Break line one of a count into its individual fields
function processCountLine1(countLine1, countNum, rawData) {
  //Break into array and remove spaces
  countLine1Array = countLine1.split(' ');
  countLine1Array = countLine1Array.filter(function (el) {
    return el != '';
  });

  //find location of fel/mis
  felMisLocation = countLine1Array.findIndex(isFelOrMisd);

  console.log(countLine1Array);
  //get section string(s) beginnging at index 5 - after title
  let offenseSection = '';
  for (j = 5; j < felMisLocation; j++) {
    if (j === 5) {
      offenseSection = countLine1Array[j];
    } else {
      offenseSection = offenseSection + ' ' + countLine1Array[j];
    }
  }
  if (felMisLocation === 5) {
    offenseSection = '-';
  }

  // get disposition string
  disposition = '';
  for (j = felMisLocation + 2; j < countLine1Array.length; j++) {
    if (j === 8) {
      disposition = countLine1Array[j];
    } else {
      disposition = disposition + ' ' + countLine1Array[j];
    }
  }

  var uid =
    docketSheetNum +
    countLine1Array[0] +
    countLine1Array[1] +
    checkDisposition(disposition);
  uid = uid.split(' ').join('_');

  offenseDisposition = checkDisposition(disposition);
  dispositionDate = countLine1Array[felMisLocation + 1];
  //Create count object with all count line 1 items
  countObject = {
    guid: guid(),
    uid: uid,
    countNum: countLine1Array[0],
    docketNum: countLine1Array[1],
    docketCounty: countLine1Array[2],
    county: countyNameFromCountyCode(countLine1Array[2]),
    titleNum: countLine1Array[4],
    sectionNum: offenseSection,
    offenseClass: countLine1Array[felMisLocation],
    dispositionDate: parseDateFromDocket(dispositionDate),
    offenseDisposition: offenseDisposition,
    filingType: 'X',
    docketSheetNum: docketSheetNum,
    outstandingPayment: isSurchageDue(rawData),
    isDismissed: isDismissed(offenseDisposition),
  };

  //Get Alleged offense date:
  try {
    offenseDateArray = rawData.match(
      /Alleged\s+offense\s+date:\s+(\d\d\/\d\d\/\d\d)/gi
    );
    offenseDateString = offenseDateArray[countNum];
    offenseDateLocation = offenseDateString.length;
    offenseDateLocationEnd = offenseDateLocation - 8;
    allegedOffenseDate = offenseDateString.substring(
      offenseDateLocation,
      offenseDateLocationEnd
    );
    countObject['allegedOffenseDate'] = parseDateFromDocket(
      allegedOffenseDate.trim()
    );
  } catch (err) {
    countObject['allegedOffenseDate'] = '';
    console.log('Error:' + err);
  }

  //Get Arrest/citation date:
  try {
    arrestDateArray = rawData.match(
      /Arrest\/Citation\s+date:\s+(\d\d\/\d\d\/\d\d)/gi
    );
    arrestDateString = arrestDateArray[countNum];
    arrestDateLocation = arrestDateString.length;
    arrestDateLocationEnd = arrestDateLocation - 8;
    arrestCitationDate = arrestDateString.substring(
      arrestDateLocation,
      arrestDateLocationEnd
    );
    countObject['arrestCitationDate'] = parseDateFromDocket(
      arrestCitationDate.trim()
    );
  } catch (err) {
    countObject['arrestCitationDate'] = '';
    console.log('Error:' + err);
  }
}
function parseDateFromDocket(date) {
  return moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
}
function isDismissed(offenseDisposition) {
  var dispositionNormalized = offenseDisposition.toLowerCase().trim();
  console.log('dis:' + dispositionNormalized);
  if (
    dispositionNormalized === 'dismissed by state' ||
    dispositionNormalized === 'dismissed by court'
  ) {
    return true;
  } else {
    return false;
  }
}
function checkDisposition(string) {
  if (string.trim() == '') {
    return 'Pending';
  } else {
    return string;
  }
}
function isFelOrMisd(element) {
  if (element === 'mis' || element === 'fel') {
    return element;
  }
  return false;
}
function isSurchageDue(rawData) {
  //if a surchage is entered in the record there is at least one def-pay section
  //if the surchage was due and has been paid, there is a finpay section.
  //if there is a defpay record and no fin pay record, then a surchage is due.
  //if there is no defpay and no finpay, then no surchage is due.

  var isSurchageDue = surchargeCreated() && !finalPayment();

  return isSurchageDue;

  function surchargeCreated() {
    return (
      rawData.includes('defpay') ||
      rawData.includes('surcharge assessed') ||
      rawData.includes('Referred to collection agency') ||
      rawData.includes('referred to collection agency')
    );
  }
  function finalPayment() {
    return rawData.includes('finpay') || rawData.includes('paid in full');
  }
}

function nthIndex(str, subStr, n) {
  var L = str.length,
    i = -1;
  while (n-- && i++ < L) {
    i = str.indexOf(subStr, i);
    if (i < 0) break;
  }
  return i;
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  );
}
