import Gumshoe from 'gumshoejs';
import dayjs from 'dayjs';
import SmoothScroll from 'smooth-scroll';
import { toRaw } from 'vue';

import saveAllCountsToHtml from 'saveFile';

let duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

const maxCountsOnNoA = 10;

function allDocketNumsObject(counts) {
  allDocketNums = counts.map(function (count) {
    return {
      num: count.docketNum,
      county: countyCodeFromCounty(count.county),
      string: count.docketNum + ' ' + countyCodeFromCounty(count.county),
    };
  });

  //filter the docket number object array to make it unique
  let result = allDocketNums.filter((e, i) => {
    return (
      allDocketNums.findIndex((x) => {
        return x.num == e.num && x.county == e.county;
      }) == i
    );
  });

  return result;
}

function allDocketSheetNumsObject(counts) {
  allDocketSheetNums = counts.map(function (count) {
    return { num: count.docketSheetNum };
  });

  //filter the docket number object array to make it unique
  let result = allDocketSheetNums.filter((e, i) => {
    return (
      allDocketSheetNums.findIndex((x) => {
        return x.num == e.num;
      }) == i
    );
  });

  return result;
}

export function autoExpand(field) {
  if (field === undefined) return;
  if (field.style === undefined) return;
  // Reset field height

  field.style.height = 'inherit';
  // Get the computed styles for the element
  let computed = window.getComputedStyle(field);

  // Calculate the height
  let height =
    parseInt(computed.getPropertyValue('border-top-width'), 5) +
    parseInt(computed.getPropertyValue('padding-top'), 5) +
    field.scrollHeight +
    parseInt(computed.getPropertyValue('padding-bottom'), 5) +
    parseInt(computed.getPropertyValue('border-bottom-width'), 5) -
    8;

  field.style.height = height + 'px';
}

export function clearAll() {
  chrome.storage.local.remove(['counts', 'responses'], function () {
    document.location.reload();
  });
}

export function confirmDeleteCount(vueApp, event, countId) {
  event.stopPropagation();
  if (vueApp.saved.counts.length > 1) {
    let currentCount = vueApp.saved.counts.filter(
      (count) => count.uid === countId
    )[0];
    if (
      confirm(
        `Are you sure that you would like to delete the count \"${currentCount.description}\"?`
      )
    ) {
      deleteCount(vueApp, countId);
    }
    return;
  }
  if (
    confirm(
      'Are you sure that you would like to delete the last count, this will clear all petitioner information.'
    )
  ) {
    clearAll();
  }
}

export function confirmClearData(vueApp) {
  if (confirm('Are you sure you want to clear all data for this petitioner?')) {
    clearAll();
  }
}

export function countyCodeFromCounty(county) {
  let countyCodes = {
    Addison: 'Ancr',
    Bennington: 'Bncr',
    Caledonia: 'Cacr',
    Chittenden: 'Cncr',
    Essex: 'Excr',
    Franklin: 'Frcr',
    'Grand Isle': 'Gicr',
    Lamoille: 'Lecr',
    Orange: 'Oecr',
    Orleans: 'Oscr',
    Rutland: 'Rdcr',
    Washington: 'Wncr',
    Windham: 'Wmcr',
    Windsor: 'Wrcr',
  };
  return countyCodes[county];
}

export function countyNameFromCountyCode(countyCode) {
  counties = {
    Ancr: 'Addison',
    Bncr: 'Bennington',
    Cacr: 'Caledonia',
    Cncr: 'Chittenden',
    Excr: 'Essex',
    Frcr: 'Franklin',
    Gicr: 'Grand Isle',
    Lecr: 'Lamoille',
    Oecr: 'Orange',
    Oscr: 'Orleans',
    Rdcr: 'Rutland',
    Wncr: 'Washington',
    Wmcr: 'Windham',
    Wrcr: 'Windsor',
  };
  return counties[countyCode];
}

export function createFilingsFromCounts(vueApp, counts, groupDockets = true) {
  // get all counties that have counts associated with them
  let filingCounties = groupByCounty(counts);

  //create an array to hold all county filing objects
  let groupedFilings = [];

  //iterate through all counties and create the filings
  for (let county in filingCounties) {
    let countyName = filingCounties[county];

    //filter all counts to the ones only needed for this county
    let allEligibleCountsForThisCounty = counts.filter(
      (count) => count.county == countyName && isFileable(count.filingType)
    );

    //figure out the filing types needed for this county.
    let filingsForThisCounty = groupByFilingType(
      allEligibleCountsForThisCounty
    );

    //if there are no filings needed for this county, move along to the next one.
    if (filingsForThisCounty.length == 0) continue;

    //create an array to hold all of the filing objects for this county
    let allFilingsForThisCountyObject = [];

    //add the notice of appearance filing to this county because we have petitions to file
    //we can only fit a maximum of ~10 docket numbers, so we will create multiple Notices of Appearance to accomodate all docket numbers.
    let maxDocketsPerNoA = maxCountsOnNoA || 10;
    let allEligibleCountsForThisCountySegmented = groupCountsByMaxDocketNumber(
      allEligibleCountsForThisCounty,
      maxDocketsPerNoA
    );

    //iterate through the filing types needed for this county and push them into the array
    for (let i in filingsForThisCounty) {
      let filingType = filingsForThisCounty[i];

      //if the filing is not one we're going to need a petition for, let's skip to the next filing type
      if (!isFileable(filingType)) continue;

      //create the filing object that will be added to the array for this county
      let filingObject = filterAndMakeFilingObject(
        counts,
        countyName,
        filingType
      );

      //determine if we can use the filling object as is, or if we need to break it into multiple petitions.
      //this is determined based on the state of the UI checkbox for grouping.
      if (groupDockets || filingObject.numDocketSheets == 1) {
        allFilingsForThisCountyObject.push(filingObject);
        vueApp.createResponseObjectForFiling(filingObject.id);
      } else {
        //break the filing object into multiple petitions
        for (let docketNumIndex in filingObject.docketSheetNums) {
          let docketSheetNumUnique =
            filingObject.docketSheetNums[docketNumIndex].num;
          let brokenOutFilingObject = filterAndMakeFilingObject(
            filingObject.counts,
            countyName,
            filingType,
            docketSheetNumUnique
          );
          allFilingsForThisCountyObject.push(brokenOutFilingObject);
          vueApp.createResponseObjectForFiling(brokenOutFilingObject.id);
        }
      }
    }
    // insert NOAs into filings
    const filingsWithNOAs = vueApp.settings.groupNoas
      ? vueApp.insertNOAsForEachCounty(allFilingsForThisCountyObject)
      : vueApp.insertNOAsForEachDocket(allFilingsForThisCountyObject);

    //add all filings for this county to the returned filing object.
    groupedFilings.push({
      county: countyName,
      filings: filingsWithNOAs,
    });
  }
  return groupedFilings;
}

export function csvData(vueApp) {
  return vueApp.rawCounts.map(function (count) {
    return {
      Petitioner_Name: vueApp.petitioner['name'],
      Petitioner_DOB: vueApp.petitioner.dob,
      Petitioner_Address: vueApp.petitioner.addressString,
      Petitioner_Phone: vueApp.responses.phone,
      County: count.county,
      Docket_Sheet_Number: count.docketSheetNum,
      Count_Docket_Number: count.docketNum,
      Filing_Type: filingNameFromType(count.filingType),
      Count_Description: count.description,
      Count_Statute_Title: count.titleNum,
      Count_Statute_Section: count.sectionNum,
      Offense_Class: offenseAbbreviationToFull(count.offenseClass),
      Offense_Disposition: count.offenseDisposition,
      Offense_Disposition_Date: count.dispositionDate,
    };
  });
}

function csvFilename(petitioner) {
  let date = new Date();
  return slugify(
    'filings for ' + petitioner.name + ' ' + date.toDateString() + '.csv'
  );
}

//Grabs name for header of filing
function filingNameFromType(filingType) {
  switch (filingType) {
    case 'NoA':
      return 'Notice of Appearance';
    case 'feeWaiver':
      return 'Motion to Waive Legal Financial Obligations';
    case 'feeWaiverAffidavit':
      return "Petitioner's Sworn Statement in Support of Motion to Waive Legal Financial Obligations";
    case 'StipExC':
      return 'Stipulated Petition to Expunge Conviction';
    case 'ExC':
      return 'Petition to Expunge Conviction';
    case 'StipExNC':
      return 'Stipulated Petition to Expunge Non-Conviction';
    case 'ExNC':
      return 'Petition to Expunge Non-Conviction';
    case 'StipExNCrim':
      return 'Stipulated Petition to Expunge Non-Criminal Conviction';
    case 'ExNCrim':
      return 'Petition to Expunge Non-Criminal Conviction';
    case 'StipSC':
      return 'Stipulated Petition to Seal Conviction of Minor';
    case 'SC':
      return 'Petition to Seal Conviction of Minor';
    case 'StipSCAdult':
      return 'Stipulated Petition to Seal Conviction';
    case 'SCAdult':
      return 'Petition to Seal Conviction';
    case 'StipSDui':
      return 'Stipulated Petition to Seal DUI Conviction';
    case 'SDui':
      return 'Petition to Seal DUI Conviction';
    case 'StipNegOp':
      return 'Stipulated Petition to Seal Negligent Operation Conviction';
    case 'NegOp':
      return 'Petition to Seal Negligent Operation Conviction';
    case 'X':
      return 'Ineligible';
    default:
      return 'None';
  }
}

function filterAndMakeFilingObject(
  counts,
  county,
  filingType,
  docketSheetNum = ''
) {
  let countsOnThisFiling = counts.filter(
    (count) =>
      count.county == county &&
      count.filingType == filingType &&
      (docketSheetNum == '' || docketSheetNum == count.docketSheetNum)
  );
  return makeFilingObject(countsOnThisFiling, filingType, county);
}

export function dateFormatSimple(value) {
  if (!value) return '';
  return dayjs(value).format('MM/DD/YYYY');
}

export function deleteCount(vueApp, countId) {
  index = vueApp.saved.counts.findIndex((x) => x.uid === countId);
  vueApp.saved.counts.splice(index, 1);
}

export function detectChangesInChromeStorage(app) {
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    let countsChange = changes['counts'];
    let responsesChange = changes['responses'];

    if (countsChange === undefined && responsesChange === undefined) return;
    if (countsChange !== undefined && countsChange.newValue === undefined) {
      clearAll();
      return;
    }
    if (!document.hasFocus() || toRaw(app.saved.counts).length === 0 && Object.keys(toRaw(app.responses)).length === 0) {
      app.loadAll(function () {});
    }
  });
}

/**
 * Replaces console.log() statements with a wrapper that prevents the extension from logging
 * to the console unless it was installed by a developer. This will keep the console clean; a
 * practice recommended for chrome extensions.
 *
 * @param {any} data Data to log to the console
 * @todo find a way to make this reusuable, then delete the duplicate fn() in popup.js
 */
export function devLog(data) {
  // see https://developer.chrome.com/extensions/management#method-getSelf
  chrome.management.getSelf(function (self) {
    if (this.installType == 'development') {
      console.log(data);
    }
  });
}

export function getError() {
  return 'TOOD: getError should work :('; // TODO: The code below explodes, so just no-op for now
  // return new Error().stack
  //   .split('\n')[1]
  //   .split('filings.js')[1]
  //   .replace(')', '')
}

export function getNextNotaryDate() {
  let currentDate = dayjs();
  let janThisYear = dayjs(currentDate.format('YYYY') + '-01-31');

  if (currentDate.isBefore(janThisYear) && isOdd(currentDate)) {
    return janThisYear.format('MMMM DD, YYYY');
  } else if (!isOdd(currentDate)) {
    return dayjs(janThisYear).add(1, 'years').format('MMMM DD, YYYY');
  } else if (currentDate.isAfter(janThisYear) && isOdd(currentDate)) {
    return dayjs(janThisYear).add(2, 'years').format('MMMM DD, YYYY');
  }
  function isOdd(num) {
    let numInt = parseInt(num.format('YYYY'));
    return numInt % 2;
  }
}

function groupByCounty(counts) {
  let allCounties = counts.map(function (count) {
    return count.county;
  });
  return allCounties.filter((v, i, a) => a.indexOf(v) === i);
}

function groupByFilingType(counts) {
  let allCounts = counts.map(function (count) {
    return count.filingType;
  });
  return allCounts.filter((v, i, a) => a.indexOf(v) === i);
}

/* Used when there are more docket numbers than will fit on a single Notice of Appearance
 * form. This takes an array[counts], and returns an array[array[counts]]. For example, if
 * the `max` is 10 dockets, then each inner array would have all the counts belonging to the
 * next 10 dockets.
 */
function groupCountsByMaxDocketNumber(counts, maxLength) {
  let allDocketNums = allDocketNumsObject(counts);
  let numDocketGroups = Math.ceil(allDocketNums.length / maxLength);
  let docketGroups = [];

  // divide all counts into arrays grouped by the `maxLength` number of dockets
  for (let i = 0; i < numDocketGroups; i++) {
    let start = i * maxLength;
    let end = Math.min(i * maxLength + maxLength, allDocketNums.length);
    let dockets = allDocketNums.slice(start, end);
    let docketNums = dockets.map((docket) => docket.num);
    let countGroup = counts.filter((f) => docketNums.includes(f.docketNum));
    docketGroups.push(countGroup);
  }

  return docketGroups;
}

export function handleNewDocketNums(sheetNum) {
  if (sheetNum.toLowerCase().includes('-cr-')) {
    return sheetNum.split(' ')[0];
  } else {
    return sheetNum;
  }
}

export function handlePrintMacro(app) {
  $(document).on('keydown', function (e) {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key == 'p' || e.charCode == 16 || e.charCode == 112 || e.keyCode == 80)
    ) {
      e.cancelBubble = true;
      e.preventDefault();
      e.stopImmediatePropagation();
      app.printDocument();
    }
  });
}

// TODO: implement or delete
export function initAfterFilingRefresh() {
  setInitialExpandForTextAreas();
  initScrollDetection();
}

export function initAfterVue() {
  //sets intital height of all text areas to show all text.
  document.addEventListener('DOMContentLoaded', () => {
    initScrollDetection();
    setInitialExpandForTextAreas();
    initTextAreaAutoExpand();
    initSmoothScroll();
  });
}

export function initScrollDetection() {
  // initates the scrollspy for the filing-nav module.
  // see: https://www.npmjs.com/package/gumshoejs#nested-navigation
  let spy = new Gumshoe('#filing-nav a', {
    nested: true,
    nestedClass: 'active-parent',
    offset: 200, // how far from the top of the page to activate a content area
    reflow: true, // will update when the navigation chages (eg, user adds/changes a petition, or consolidates petitions/NOAs)
  });
}

export function initSmoothScroll() {
  let scroll = new SmoothScroll('a[href*="#"]', {
    offset: 150,
    durationMax: 300,
  });
}

export function initTextAreaAutoExpand() {
  document.addEventListener(
    'input',
    function (event) {
      if (event.target.tagName.toLowerCase() !== 'textarea') return;
      autoExpand(event.target);
    },
    false
  );
}

function isEligible(filingType) {
  return filingType != 'X';
}

function isFileable(filingType) {
  return isSupported(filingType) && isEligible(filingType);
}

function isSupported(filingType) {
  switch (filingType) {
    case 'NoA':
    case 'StipExC':
    case 'ExC':
    case 'StipExNC':
    case 'ExNC':
    case 'StipExNCrim':
    case 'ExNCrim':
    case 'StipSC':
    case 'StipSCAdult':
    case 'StipSDui':
    case 'SC':
    case 'SCAdult':
    case 'SDui':
    case 'NegOp':
    case 'StipNegOp':
    case 'X':
      return true;
    default:
      return false;
  }
}

function isStipulated(filingType) {
  return (
    filingType == 'StipExC' ||
    filingType == 'StipExNC' ||
    filingType == 'StipExNCrim' ||
    filingType == 'StipSC' ||
    filingType == 'StipSCAdult' ||
    filingType == 'StipSDui' ||
    filingType == 'StipNegOp'
  );
}

export function loadAll(vueApp, callback) {
  if (callback === undefined) {
    callback = function () {};
  }
  devLog(localStorage.getItem('localExpungeVTSettings'));
  localResult = JSON.parse(localStorage.getItem('localExpungeVTSettings'));
  if (localResult !== undefined && localResult !== '' && localResult !== null) {
    vueApp.settings = localResult;
  } else {
    vueApp.saveSettings();
  }

  chrome.storage.local.get(function (result) {
    //test if we have any data
    devLog('loading all');
    devLog(JSON.stringify(result));
    if (result.counts !== undefined) {
      devLog(result.counts);
      vueApp.saved = result.counts;
    }

    if (result.responses !== undefined) {
      vueApp.responses = result.responses;
    }

    callback();
    //this.$nextTick(function () {
    //call any vanilla js functions that need to run after vue is all done setting up.
    //initAfterVue();
    //});
  });
}

export function linesBreaksFromArray(array) {
  let string = '';
  let delimiter = '\r\n';
  let i;
  for (i = 0; i < array.length; i++) {
    if (i > 0) {
      string += delimiter;
    }
    string += array[i];
  }
  return string;
}

export function lowercase(value) {
  if (!value) return '';
  value = value.toString();
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/*
 * Creates a filing object from data provided.
 * NOTE: will fail without explaination on civil violations b/c this presumes `counts` is a non-empty array
 */
export function makeFilingObject(counts, filingType, county) {
  let countsOnThisFiling = counts;
  let numCounts = countsOnThisFiling.length;
  let docketNums = allDocketNumsObject(countsOnThisFiling);
  let numDockets = docketNums.length;
  let docketSheetNums = allDocketSheetNumsObject(countsOnThisFiling);
  let numDocketSheets = docketSheetNums.length;
  let isMultipleCounts = numCounts > 1;
  let filingId = filingType + '-' + county + '-' + docketNums[0].num;

  return {
    id: filingId,
    type: filingType,
    title: filingNameFromType(filingType),
    county: county,
    numCounts: numCounts,
    numDockets: numDockets,
    numDocketSheets: numDocketSheets,
    multipleCounts: isMultipleCounts,
    numCountsString: pluralize('Count', numCounts),
    numDocketsString: pluralize('Docket', numDockets),
    isStipulated: isStipulated(filingType),
    isEligible: isEligible(filingType),
    docketNums: docketNums,
    docketSheetNums: docketSheetNums,
    counts: countsOnThisFiling,
  };
}

export function maxDate() {
  let date = dayjs().format("YYYY-MM-DD");
  return date;
}

function offenseAbbreviationToFull(offenseClass) {
  switch (offenseClass) {
    case 'mis':
      return 'Misdemeanor';
    case 'fel':
      return 'Felony';
    default:
      return '';
  }
}

export function openManagePage() {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      let index = tabs[0].index;
      chrome.tabs.create({
        url: chrome.runtime.getURL('./manage-counts.html'),
        index: index + 1,
      });
    }
  );
}

export function pluralize(word, num) {
  let phrase = num + ' ' + word;
  if (num > 1) return phrase + 's';
  return phrase;
}

export function nl2br(rawStr) {
  let breakTag = '<br>';
  return (rawStr + '').replace(
    /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,
    '$1' + breakTag + '$2'
  );
}

export function openPetitionsPage() {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      let index = tabs[0].index;
      chrome.tabs.create({
        url: chrome.runtime.getURL('./filings.html'),
        index: index + 1,
      });
    }
  );
}

export function resetSettings(vueApp, element) {
  if (confirm('Are you sure you want to reset setting to the defaults?')) {
    localStorage.removeItem(['localExpungeVTSettings']);
    vueApp.settings = {
      attorney: '',
      attorneyAddress: '',
      attorneyPhone: '',
      footer1: '- Generated by ExpungeVT -',
      footer2: '- A Code for BTV Project -',
      role: 'AttyConsult',
      forVla: false,
    };
  }
}

export function saveCounts(counts) {
  if (document.hasFocus()) {
    chrome.storage.local.set({
      counts: counts,
    });
  }
}

export function saveHtml(vueApp) {
  let dataPojo = {
    saved: vueApp.saved,
    responses: vueApp.responses,
  };
  saveAllCountsToHtml(JSON.stringify(dataPojo));
}

export function saveResponses(responses) {
  devLog('save responses' + getError());
  if (document.hasFocus()) {
    chrome.storage.local.set({
      responses: responses,
    });
  }
}

export function saveSettings(settings) {
  settingString = JSON.stringify(settings);
  if (document.hasFocus()) {
    localStorage.setItem('localExpungeVTSettings', settingString);
  }
}

export function setInitialExpandForTextAreas() {
  //sets the default size for all text areas based on their content.
  //call this after vue has initialized and displayed
  let textAreas = document.getElementsByTagName('textarea');
  for (let index in textAreas) {
    let textArea = textAreas[index];
    if (textArea === undefined) return;
    autoExpand(textArea);
  }
}

export function sinceNow(value) {
  if (!value) return '';

  let fromTime = dayjs(value).diff(dayjs(), 'milliseconds');
  let duration = dayjs.duration(fromTime);
  let years = duration.years() / -1;
  let months = duration.months() / -1;
  let days = duration.days() / -1;
  if (years > 0) {
    let Ys = years == 1 ? years + 'y ' : years + 'y ';
    let Ms = months == 1 ? months + 'm ' : months + 'm ';
    return Ys + Ms;
  } else {
    if (months > 0) return months == 1 ? months + 'm ' : months + 'm ';
    else return days == 1 ? days + 'd ' : days + 'd ';
  }
}

export function slugify(string) {
  return string.replace(/\s+/g, '-').toLowerCase();
}

export function stringAgeInYearsAtDate(date, dob) {
  if (!date) return '';
  if (!dob) return '';
  let fromTime = dayjs(date).diff(dayjs(dob));
  let duration = dayjs.duration(fromTime);
  return (duration.asDays() / 365.25).toFixed(0) + ' yo';
}

export function toCountyCode(value) {
  if (!value) return '';
  return countyCodeFromCounty(value);
}

export function todayDate() {
  date = dayjs().format('MMMM D[, ]YYYY');
  return date;
}

export function uppercase(value) {
  if (!value) return '';
  value = value.toString();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
