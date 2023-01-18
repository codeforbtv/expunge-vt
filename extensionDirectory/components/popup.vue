<script>
import $ from 'jquery';
import moment from 'moment';
import Gumshoe from 'gumshoejs'
import SmoothScroll from 'smooth-scroll';
// import Vue as * from 'vue';

import pillsRow from './pills-row.vue';
import checkoutOffenseRow from './checkout-offense-row.vue'
import docketCaption from './docket-caption.vue'
import filingDatedCity from './filing-dated-city.vue'
import filingFooter from './filing-footer.vue'
import filingNav from './filing-nav.vue'
import filingTypeHeading from './filing-type-heading.vue'

const maxCountsOnNoA = 10;
// Vue.config.devtools = true;

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

/**
 * Replaces console.log() statements with a wrapper that prevents the extension from logging
 * to the console unless it was installed by a developer. This will keep the console clean; a
 * practice recommended for chrome extensions.
 *
 * @param {any} data Data to log to the console
 * @todo find a way to make this reusuable, then delete the duplicate fn() in popup.js
 */
function devLog(data) {
  // see https://developer.chrome.com/extensions/management#method-getSelf
  chrome.management.getSelf(function (self) {
    if (self.installType == 'development') {
      console.log(data);
    }
  });
}

function initAfterVue() {
  //sets intital height of all text areas to show all text.
  devLog(document.getElementsByTagName('body')[0].id);
  if (document.getElementsByTagName('body')[0].id === 'filing-page') {
    initScrollDetection();
    setInitialExpandForTextAreas();
    initTextAreaAutoExpand();
    initSmoothScroll();
  }
}

// TODO: implement or delete
function initAfterFilingRefresh() {
  setInitialExpandForTextAreas();
  initScrollDetection();
}

function initTextAreaAutoExpand() {
  document.addEventListener(
    'input',
    function (event) {
      if (event.target.tagName.toLowerCase() !== 'textarea') return;
      autoExpand(event.target);
    },
    false
  );
}

function initSmoothScroll() {
  var scroll = new SmoothScroll('a[href*="#"]', {
    offset: 150,
    durationMax: 300,
  });
}

function detectChangesInChromeStorage() {
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    var countsChange = changes['counts'];
    var responsesChange = changes['responses'];

    if (countsChange === undefined && responsesChange === undefined) return;
    if (countsChange.newValue === undefined) {
      app.clearAll();
      return;
    }
    app.loadAll(function () { });
  });
}

function initScrollDetection() {
  // initates the scrollspy for the filing-nav module.
  // see: https://www.npmjs.com/package/gumshoejs#nested-navigation
  var spy = new Gumshoe('#filing-nav a', {
    nested: true,
    nestedClass: 'active-parent',
    offset: 200, // how far from the top of the page to activate a content area
    reflow: true, // will update when the navigation chages (eg, user adds/changes a petition, or consolidates petitions/NOAs)
  });
}

function setInitialExpandForTextAreas() {
  //sets the default size for all text areas based on their content.
  //call this after vue has initialized and displayed
  var textAreas = document.getElementsByTagName('textarea');
  for (var index in textAreas) {
    var textArea = textAreas[index];
    if (textArea === undefined) return;
    autoExpand(textArea);
  }
}

function autoExpand(field) {
  if (field === undefined) return;
  if (field.style === undefined) return;
  // Reset field height

  field.style.height = 'inherit';
  // Get the computed styles for the element
  var computed = window.getComputedStyle(field);

  // Calculate the height
  var height =
    parseInt(computed.getPropertyValue('border-top-width'), 5) +
    parseInt(computed.getPropertyValue('padding-top'), 5) +
    field.scrollHeight +
    parseInt(computed.getPropertyValue('padding-bottom'), 5) +
    parseInt(computed.getPropertyValue('border-bottom-width'), 5) -
    8;

  field.style.height = height + 'px';
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
function countyCodeFromCounty(county) {
  countyCodes = {
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

function getError() {
  return 'TOOD: getError should work :('; // TODO: The code below explodes, so just no-op for now
  // return new Error().stack
  //   .split('\n')[1]
  //   .split('filings.js')[1]
  //   .replace(')', '')
}

/**
 * Replaces console.log() statements with a wrapper that prevents the extension from logging
 * to the console unless it was installed by a developer. This will keep the console clean; a
 * practice recommended for chrome extensions.
 *
 * @param {any} data Data to log to the console
 * @todo find a way to make this reusuable, then delete the duplicate fn() in popup.js
 */
function devLog(data) {
  // see https://developer.chrome.com/extensions/management#method-getSelf
  chrome.management.getSelf(function (self) {
    if (self.installType == 'development') {
      console.log(data);
    }
  });
}

export default {
  // el: '#filing-app',
  components: {
    pillsRow,
    checkoutOffenseRow,
    docketCaption,
    filingDatedCity,
    filingFooter,
    filingNav,
    filingTypeHeading
  },
  data() {
    return {
      settings: {
        attorney: '',
        attorneyAddress: '',
        attorneyPhone: '',
        footer1: '- Generated by ExpungeVT -',
        footer2: '- A Code for BTV Project -',
        customNote: '',
        role: 'AttyConsult',
        forVla: true,
        emailConsent: true,
        affidavitRequired: false,
        groupCounts: false,
        groupNoas: false,
      },
      saved: {
        defName: '',
        defAddress: [''],
        defDOB: '',
        counts: [],
        defEmail: '',
      },
      responses: {},
      fees: {},
      fines: {},
      countiesContact: {},
      popupHeadline: '',
      roleCoverLetterText: {},
      coverLetterContent: {},
      stipDef: {},
    };
  },
  // data: {
  //   settings: {
  //     attorney: '',
  //     attorneyAddress: '',
  //     attorneyPhone: '',
  //     footer1: '- Generated by ExpungeVT -',
  //     footer2: '- A Code for BTV Project -',
  //     customNote: '',
  //     role: 'AttyConsult',
  //     forVla: true,
  //     emailConsent: true,
  //     affidavitRequired: false,
  //     groupCounts: false,
  //     groupNoas: false,
  //   },
  //   saved: {
  //     defName: '',
  //     defAddress: [''],
  //     defDOB: '',
  //     counts: [],
  //     defEmail: '',
  //   },
  //   responses: {},
  //   fees: {},
  //   fines: {},
  //   countiesContact: {},
  //   popupHeadline: '',
  //   roleCoverLetterText: {},
  //   coverLetterContent: {},
  //   stipDef: {},
  // },
  watch: {
    // Affects "consolidation" checkboxes in filings page header
    // This watch ensures that "NoAs" checkbox IS checked when "Petitions" checkbox is checked
    groupCounts: {
      handler(value) {
        if (value) {
          this.settings.groupNoas = true;
        }
      },
    },
    // Affects "consolidation" checkboxes in filings page header
    // This watch ensures that "Petitions" checkbox IS NOT checked when unchecking "NoAs" checkbox
    groupNoas: {
      handler(value) {
        if (!value) {
          this.settings.groupCounts = false;
        }
      },
    },
    responses: {
      handler() {
        this.saveResponses();
      },
      deep: true,
    },
    settings: {
      handler() {
        this.saveSettings();
        //this.$nextTick(function () {
          //vanilla js
        //});
      },
      deep: true,
    },
    saved: {
      handler() {
        devLog(
          'counts updated - line:' + getError()
        );
        this.saveCounts();
        //this.$nextTick(function () {
          //call any vanilla js functions after update.
          //initAfterFilingRefresh();
        //});
      },
      deep: true,
    },
  },
  beforeCreate() {
    $.getJSON(
      'https://raw.githubusercontent.com/codeforbtv/expungeVT-admin/master/config/adminConfig.json',
      function (data) {
          console.log(this);
        this.countiesContact = data['countyContacts'];
        this.popupHeadline = data['expungeHeadline'];
        this.roleCoverLetterText = data['roleText'];
        this.coverLetterContent = data['letter'];
        this.stipDef = data['stipDefinition'];
        devLog(
          'adminConfig data has been set at line: ' + getError()
        );
        devLog(data);
      }
    );
  },
  mounted() {
    devLog('App mounted!');
    this.loadAll();
    detectChangesInChromeStorage();

    //This is to make sure dynamically created table are unique across tab in order to avoid errors
    this.uniqueId = this._uid;
  },
  methods: {
    saveSettings: function () {
      // devLog("save settings", this.settings)
      settingString = JSON.stringify(this.settings);
      localStorage.setItem('localExpungeVTSettings', settingString);
    },
    saveResponses: function () {
      devLog(
        'save responses' + getError()
      );
      chrome.storage.local.set({
        responses: this.responses,
      });
    },
    saveCounts: function () {
      devLog('saving counts');
      chrome.storage.local.set({
        counts: this.saved,
      });
    },
    loadAll: function (callback) {
      if (callback === undefined) {
        callback = function () { };
      }
      devLog(localStorage.getItem('localExpungeVTSettings'));
      localResult = JSON.parse(localStorage.getItem('localExpungeVTSettings'));
      if (
        localResult !== undefined &&
        localResult !== '' &&
        localResult !== null
      ) {
        devLog('settings found');
        this.settings = localResult;
        devLog(this.settings);
      } else {
        devLog('No settings found, saving default settings');
        this.saveSettings();
      }

      chrome.storage.local.get(function (result) {
        //test if we have any data
        devLog('loading all');
        devLog(JSON.stringify(result));
        if (result.counts !== undefined) {
          devLog(result.counts);
          this.saved = result.counts;
        }

        if (result.responses !== undefined) {
          this.responses = result.responses;
        }

        callback();
        //this.$nextTick(function () {
          //call any vanilla js functions that need to run after vue is all done setting up.
          //initAfterVue();
        //});
        setTimeout(() => {
          initAfterVue();
        }, 0);
      });
    },

    /**
     * Creates the petition filings (including NOAs) from collected counts
     *
     * @param {Object} counts Count objects used to generate petitons
     * @param {boolean} groupDockets Indicates whether to consolidate dockets into single petitons
     */
    createFilingsFromCounts: function (counts, groupDockets = true) {
      // get all counties that have counts associated with them
      var filingCounties = this.groupByCounty(counts);

      devLog(
        'there are ' +
        filingCounties.length +
        ' counties for ' +
        counts.length +
        ' counts'
      );

      //create an array to hold all county filing objects
      var groupedFilings = [];

      //iterate through all counties and create the filings
      for (var county in filingCounties) {
        var countyName = filingCounties[county];

        //filter all counts to the ones only needed for this county
        var allEligibleCountsForThisCounty = counts.filter(
          (count) =>
            count.county == countyName && this.isFileable(count.filingType)
        );

        //figure out the filing types needed for this county.
        var filingsForThisCounty = this.groupByFilingType(
          allEligibleCountsForThisCounty
        );

        devLog(
          'there are ' +
          filingsForThisCounty.length +
          ' different filings needed in ' +
          countyName
        );

        //if there are no filings needed for this county, move along to the next one.
        if (filingsForThisCounty.length == 0) continue;

        //create an array to hold all of the filing objects for this county
        var allFilingsForThisCountyObject = [];

        //add the notice of appearance filing to this county because we have petitions to file
        //we can only fit a maximum of ~10 docket numbers, so we will create multiple Notices of Appearance to accomodate all docket numbers.
        var maxDocketsPerNoA = maxCountsOnNoA || 10;
        var allEligibleCountsForThisCountySegmented = this.groupCountsByMaxDocketNumber(
          allEligibleCountsForThisCounty,
          maxDocketsPerNoA
        );

        //iterate through the filing types needed for this county and push them into the array
        for (var i in filingsForThisCounty) {
          var filingType = filingsForThisCounty[i];

          //if the filing is not one we're going to need a petition for, let's skip to the next filing type
          if (!this.isFileable(filingType)) continue;

          //create the filing object that will be added to the array for this county
          var filingObject = this.filterAndMakeFilingObject(
            counts,
            countyName,
            filingType
          );

          //determine if we can use the filling object as is, or if we need to break it into multiple petitions.
          //this is determined based on the state of the UI checkbox for grouping.
          if (groupDockets || filingObject.numDocketSheets == 1) {
            allFilingsForThisCountyObject.push(filingObject);
            this.createResponseObjectForFiling(filingObject.id);
          } else {
            //break the filing object into multiple petitions
            for (var docketNumIndex in filingObject.docketSheetNums) {
              var docketSheetNumUnique =
                filingObject.docketSheetNums[docketNumIndex].num;
              var brokenOutFilingObject = this.filterAndMakeFilingObject(
                filingObject.counts,
                countyName,
                filingType,
                docketSheetNumUnique
              );
              allFilingsForThisCountyObject.push(brokenOutFilingObject);
              this.createResponseObjectForFiling(brokenOutFilingObject.id);
            }
          }
        }
        // insert NOAs into filings
        const filingsWithNOAs = this.settings.groupNoas
          ? this.insertNOAsForEachCounty(allFilingsForThisCountyObject)
          : this.insertNOAsForEachDocket(allFilingsForThisCountyObject);

        //add all filings for this county to the returned filing object.
        groupedFilings.push({
          county: countyName,
          filings: filingsWithNOAs,
        });
      }
      return groupedFilings;
    },

    /* Used when there are more docket numbers than will fit on a single Notice of Appearance
     * form. This takes an array[counts], and returns an array[array[counts]]. For example, if
     * the `max` is 10 dockets, then each inner array would have all the counts belonging to the
     * next 10 dockets.
     */
    groupCountsByMaxDocketNumber: function (counts, maxLength) {
      var allDocketNums = this.allDocketNumsObject(counts);
      var numDocketGroups = Math.ceil(allDocketNums.length / maxLength);
      var docketGroups = [];

      // divide all counts into arrays grouped by the `maxLength` number of dockets
      for (var i = 0; i < numDocketGroups; i++) {
        var start = i * maxLength;
        var end = Math.min(i * maxLength + maxLength, allDocketNums.length);
        var dockets = allDocketNums.slice(start, end);
        var docketNums = dockets.map((docket) => docket.num);
        var countGroup = counts.filter((f) => docketNums.includes(f.docketNum));
        docketGroups.push(countGroup);
      }

      return docketGroups;
    },

    /*
     * Inserts an NOA each time the county changes in the array of filings.
     * @param {object} filings      An array of filing objects that needs some NOAs added to it
     * @param {string} countyName   The name of the county is needed by the fn() that creates the NOA
     */
    insertNOAsForEachCounty: function (filings) {
      let lastCounty = '';
      let filingsWithNOAs = [];

      // loop over all the filings
      for (var i = 0; i < filings.length; i++) {
        const thisFiling = filings[i];
        const currCounty = thisFiling.county;

        // when the county changes, insert a NOA
        if (lastCounty != currCounty) {
          const counts = filings
            .filter((f) => f.county == currCounty)
            .map((f) => f.counts)
            .flat();
          const noa = this.createNOAFiling(currCounty, counts);
          filingsWithNOAs.push(noa);

          if (this.responses[noa.id + '-feeForm'] === undefined) {
            this.responses[noa.id + '-feeForm'] = false;
          } else if (this.responses[noa.id + '-feeForm']) {
            const feeFiling = this.createFeeFiling(
              thisFiling.county,
              docketCounts
            );
            const feeFilingAffidavit = this.createFeeFilingAffidavit(
              thisFiling.county,
              docketCounts
            );
            filingsWithNOAs.push(feeFiling);
            filingsWithNOAs.push(feeFilingAffidavit);
          }

          lastCounty = currCounty;
        }

        // always copy over the filings to new array
        filingsWithNOAs.push(thisFiling);
      }
      return filingsWithNOAs;
    },

    /*
     * Inserts an NOA each time the docket changes in the array of filings.
     * @param {object[]} filings      An array of filing objects that needs some NOAs added to it
     */
    insertNOAsForEachDocket: function (filings) {
      let lastDocketNum = '';
      let filingsWithNOAs = [];

      // sorted filings by docket
      var sortedFilings = filings.sort((a, b) =>
        a.docketNums[0].num > b.docketNums[0].num ? 1 : -1
      );

      // loop over all the sortedFilings
      for (var i = 0; i < sortedFilings.length; i++) {
        const thisFiling = sortedFilings[i];
        const currDocketNum = thisFiling.docketNums[0].string;

        // Conditionally insert a NOA at the beginning of each new string of docket petitions
        if (lastDocketNum != currDocketNum) {
          const docketCounts = sortedFilings
            .map(function (f) {
              if (
                f.docketSheetNums.filter((n) => n.num == currDocketNum).length >
                0
              ) {
                return f.counts;
              } else {
                return [];
              }
            })
            .flat();
          const noa = this.createNOAFiling(thisFiling.county, docketCounts);
          filingsWithNOAs.push(noa);

          if (this.responses[noa.id + '-feeForm'] === undefined) {
            this.responses[noa.id + '-feeForm'] = false;
          } else if (this.responses[noa.id + '-feeForm']) {
            const feeFiling = this.createFeeFiling(
              thisFiling.county,
              docketCounts
            );
            const feeFilingAffidavit = this.createFeeFilingAffidavit(
              thisFiling.county,
              docketCounts
            );
            filingsWithNOAs.push(feeFiling);
            filingsWithNOAs.push(feeFilingAffidavit);
          }

          lastDocketNum = currDocketNum;
        }

        // always copy over the filings to new array
        filingsWithNOAs.push(thisFiling);
      }
      return filingsWithNOAs;
    },

    createResponseObjectForFiling: function (id) {
      if (this.responses[id] === undefined) {
        this.responses[id] = '';
      }
    },

    /*
     * Helper function to make a "Notice of Appearance" object that can be
     * inserted into arrays of filings.
     */
    createNOAFiling: function (county, counts) {
      return this.makeFilingObject(counts, 'NoA', county);
    },
    createFeeFiling: function (county, counts) {
      return this.makeFilingObject(counts, 'feeWaiver', county);
    },
    createFeeFilingAffidavit: function (county, counts) {
      return this.makeFilingObject(counts, 'feeWaiverAffidavit', county);
    },
    groupIneligibleCounts: function (counts) {
      var ineligibleCounts = counts.filter((count) => count.filingType == 'X');
      return ineligibleCounts;
    },
    groupNoAction: function (counts) {
      var noActionCounts = counts.filter((count) => count.filingType == '');
      return noActionCounts;
    },
    groupByCounty: function (counts) {
      var allCounties = counts.map(function (count) {
        return count.county;
      });
      return allCounties.filter((v, i, a) => a.indexOf(v) === i);
    },
    groupByFilingType: function (counts) {
      var allCounts = counts.map(function (count) {
        return count.filingType;
      });
      return allCounts.filter((v, i, a) => a.indexOf(v) === i);
    },
    allDocketNumsObject: function (counts) {
      allDocketNums = counts.map(function (count) {
        return {
          num: count.docketNum,
          county: countyCodeFromCounty(count.county),
          string: count.docketNum + ' ' + countyCodeFromCounty(count.county),
        };
      });

      //filter the docket number object array to make it unique
      var result = allDocketNums.filter((e, i) => {
        return (
          allDocketNums.findIndex((x) => {
            return x.num == e.num && x.county == e.county;
          }) == i
        );
      });

      return result;
    },
    allDocketSheetNumsObject: function (counts) {
      allDocketSheetNums = counts.map(function (count) {
        return { num: count.docketSheetNum };
      });

      //filter the docket number object array to make it unique
      var result = allDocketSheetNums.filter((e, i) => {
        return (
          allDocketSheetNums.findIndex((x) => {
            return x.num == e.num;
          }) == i
        );
      });

      return result;
    },
    isStipulated: function (filingType) {
      return (
        filingType == 'StipExC' ||
        filingType == 'StipExNC' ||
        filingType == 'StipExNCrim' ||
        filingType == 'StipSC' ||
        filingType == 'StipSDui'
      );
    },
    isEligible: function (filingType) {
      return filingType != 'X';
    },
    isFileable: function (filingType) {
      return this.isSupported(filingType) && this.isEligible(filingType);
    },
    isSupported: function (filingType) {
      switch (filingType) {
        case 'NoA':
        case 'StipExC':
        case 'ExC':
        case 'StipExNC':
        case 'ExNC':
        case 'StipExNCrim':
        case 'ExNCrim':
        case 'StipSC':
        case 'StipSDui':
        case 'SC':
        case 'SDui':
        case 'X':
          return true;
        default:
          return false;
      }
    },
    //Grabs name for header of filing
    filingNameFromType: function (filingType) {
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
          return 'Stipulated Petition to Seal Conviction';
        case 'SC':
          return 'Petition to Seal Conviction';
        case 'StipSDui':
          return 'Stipulated Petition to Seal DUI Conviction';
        case 'SDui':
          return 'Petition to Seal DUI Conviction';
        case 'X':
          return 'Ineligible';
        default:
          return 'None';
      }
    },
    offenseAbbreviationToFull: function (offenseClass) {
      switch (offenseClass) {
        case 'mis':
          return 'Misdemeanor';
        case 'fel':
          return 'Felony';
        default:
          return '';
      }
    },
    filterAndMakeFilingObject: function (
      counts,
      county,
      filingType,
      docketSheetNum = ''
    ) {
      var countsOnThisFiling = counts.filter(
        (count) =>
          count.county == county &&
          count.filingType == filingType &&
          (docketSheetNum == '' || docketSheetNum == count.docketSheetNum)
      );
      return this.makeFilingObject(countsOnThisFiling, filingType, county);
    },
    /*
     * Creates a filing object from data provided.
     * NOTE: will fail without explaination on civil violations b/c this presumes `counts` is a non-empty array
     */
    makeFilingObject: function (counts, filingType, county) {
      var countsOnThisFiling = counts;
      var numCounts = countsOnThisFiling.length;
      var docketNums = this.allDocketNumsObject(countsOnThisFiling);
      var numDockets = docketNums.length;
      var docketSheetNums = this.allDocketSheetNumsObject(countsOnThisFiling);
      var numDocketSheets = docketSheetNums.length;
      var isMultipleCounts = numCounts > 1;
      var filingId = filingType + '-' + county + '-' + docketNums[0].num;

      return {
        id: filingId,
        type: filingType,
        title: this.filingNameFromType(filingType),
        county: county,
        numCounts: numCounts,
        numDockets: numDockets,
        numDocketSheets: numDocketSheets,
        multipleCounts: isMultipleCounts,
        numCountsString: this.pluralize('Count', numCounts),
        numDocketsString: this.pluralize('Docket', numDockets),
        isStipulated: this.isStipulated(filingType),
        isEligible: this.isEligible(filingType),
        docketNums: docketNums,
        docketSheetNums: docketSheetNums,
        counts: countsOnThisFiling,
      };
    },
    newCount: function (event) {
      this.saved.counts.push({ description: 'New', filingType: '' });
    },
    confirmDeleteCount: function (event, countId) {
      event.stopPropagation();
      if (this.saved.counts.length > 1) {
        var currentCount = this.saved.counts.filter(
          (count) => count.uid === countId
        )[0];
        if (
          confirm(
            `Are you sure that you would like to delete the count \"${currentCount.description}\"?`
          )
        ) {
          this.deleteCount(countId);
        }
        return;
      }
      if (
        confirm(
          'Are you sure that you would like to delete the last count, this will clear all petitioner information.'
        )
      ) {
        this.clearAll();
      }
    },
    deleteCount: function (countId) {
      index = this.saved.counts.findIndex((x) => x.uid === countId);
      Vue.delete(this.saved.counts, index);
    },
    clearAll: function () {
      chrome.storage.local.remove(['counts', 'responses'], function () {
        document.location.reload();
      });
    },
    nl2br: function (rawStr) {
      var breakTag = '<br>';
      return (rawStr + '').replace(
        /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,
        '$1' + breakTag + '$2'
      );
    },
    linesBreaksFromArray: function (array) {
      var string = '';
      var delimiter = '\r\n';
      var i;
      for (i = 0; i < array.length; i++) {
        if (i > 0) {
          string += delimiter;
        }
        string += array[i];
      }
      return string;
    },
    pluralize: function (word, num) {
      var phrase = num + ' ' + word;
      if (num > 1) return phrase + 's';
      return phrase;
    },
    slugify: function (string) {
      return string.replace(/\s+/g, '-').toLowerCase();
    },
    openPetitionsPage: function () {
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
    },
    addAndOpenManagePage: function () {
      if (this.saved.counts.length == 0) {
        this.newCount();
        this.saved['defName'] = 'New Petitioner';
      }
      this.openManagePage();
    },
    openManagePage: function (element) {
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
    },
    addDocketCounts: function () {
      // TODO: consider using content_scripts instead to avoid loading payload.js every time the
      // 'Add From Page' button is clicked.
      // see: https://stackoverflow.com/a/42989406/263900
      chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
        chrome.scripting.executeScript(
        {
          target: {tabId: tab.id},
          files: ['payload.js']
        });
      })
    },
    loadCaseFile: async function () {
      var query = { active: true, currentWindow: true };
      function getTabUrl() {
        return new Promise((resolve, reject) => {
          try {
            chrome.tabs.query(query, function (tabs) {
              resolve(tabs[0].url);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
      let url = await getTabUrl();
      if (url.split('/')[0] != 'file:') {
        alert(
          'The Load Case File function only works for expungeVT files saved on your computer. You may need to right click or ctrl+click (on Mac) on the file to open the file in Chrome. Then follow the instructions on your screen.'
        );
        return;
      }

      chrome.extension.isAllowedFileSchemeAccess(function (isAllowedAccess) {
        if (isAllowedAccess) {
          // alert for a quick demonstration, please create your own user-friendly UI
          chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
            chrome.scripting.executeScript(
            {
              target: {tabId: tab.id},
              files: ['payload.js']
            });
          })
        } else {
          var goToSettings = confirm(
            'You need to grant file permissions to load a case file. Would you like to go to settings?\n\n\n\nIn settings, make sure "Allow access to file URLs" is on.'
          );
          if (goToSettings) {
            chrome.tabs.create({
              url: 'chrome://extensions/?id=' + chrome.runtime.id,
            });
          }
        }
      });
    },
    confirmClearData: function () {
      if (
        confirm('Are you sure you want to clear all data for this petitioner?')
      ) {
        this.clearAll();
      }
    },
    resetSettings: function (element) {
      if (confirm('Are you sure you want to reset setting to the defaults?')) {
        localStorage.removeItem(['localExpungeVTSettings']);
        this.settings = {
          attorney: '',
          attorneyAddress: '',
          attorneyPhone: '',
          footer1: '- Generated by ExpungeVT -',
          footer2: '- A Code for BTV Project -',
          role: 'AttyConsult',
          forVla: true,
        };
      }
    },
    printDocument: function () {
      window.print();
    },
    saveHtml: function () {
      let dataPojo = {
        saved: this.saved,
        responses: this.responses,
      };
      saveAllCountsToHtml(JSON.stringify(dataPojo));
    },
    returnCountyContact: function (cty) {
      allCounties = this.countiesContact;
      devLog('Number: ' + allCounties[cty]);
      return allCounties[cty];
    },
    proSeFromRole: function (preparerRole) {
      if (preparerRole == 'AttyAppear') {
        return false;
      } else {
        return true;
      }
    },
    checkDocketMatch: function (longDocket, shortDocket, county) {
      if (!longDocket) return false;
      let concatDocket = shortDocket + ' ' + countyCodeFromCounty(county);

      if (concatDocket !== longDocket) {
        return false;
      } else {
        return true;
      }
    },
    getFeeWaiverStatusFromFiling: function (filingId) {
      docket =
        'NoA-' + filingId.substring(filingId.indexOf('-') + 1) + '-feeForm';
      return this.responses[docket];
    },
    numOfFeeWaiversInGroup: function (filings) {
      return filings.filter((f) => f.type == 'feeWaiver').length;
    },
    getNextNotaryDate: function () {
      let currentDate = moment();
      let janThisYear = moment(currentDate.format('YYYY') + '-01-31');

      if (currentDate.isBefore(janThisYear) && isOdd(currentDate)) {
        return janThisYear.format('MMMM DD, YYYY');
      } else if (!isOdd(currentDate)) {
        return moment(janThisYear).add(1, 'years').format('MMMM DD, YYYY');
      } else if (currentDate.isAfter(janThisYear) && isOdd(currentDate)) {
        return moment(janThisYear).add(2, 'years').format('MMMM DD, YYYY');
      }
      function isOdd(num) {
        let numInt = parseInt(num.format('YYYY'));
        return numInt % 2;
      }
    },
    notarizableFilings: function (filings) {
      let affidavitCount = 0;
      filings.forEach((county) => {
        county.filings.forEach((filing) => {
          if (filing.type === 'feeWaiverAffidavit') {
            affidavitCount++;
          }
        });
      });
      if (affidavitCount > 0) {
        return true;
      } else {
        return false;
      }
    },
  },
  computed: {
    petitioner: function () {
      return {
        name: this.saved.defName,
        dob: this.saved.defDOB,
        address: this.nl2br(this.saved.defAddress),
        email: this.saved.defEmail,
      };
    },

    /* "Filings" include the Notice of Appearance (NoA) forms */
    filings: function () {
      var shouldGroupCounts =
        this.settings.groupCounts !== undefined
          ? this.settings.groupCounts
          : true;
      return this.createFilingsFromCounts(this.saved.counts, shouldGroupCounts); //counts, groupCountsFromMultipleDockets=true
    },
    numCountsToExpungeOrSeal: function () {
      return this.saved.counts.filter((count) => count.filingType !== 'X')
        .length;
    },
    numCountsNoAction: function () {
      return this.saved.counts.filter((count) => count.filingType === 'X')
        .length;
    },
    ineligible: function () {
      return this.groupIneligibleCounts(this.saved.counts);
    },
    noAction: function () {
      return this.groupNoAction(this.saved.counts);
    },
    numCountsIneligible: function () {
      return this.ineligible.length;
    },
    numCountsStipulated: function () {
      let stipCount = 0;
      this.saved.counts.forEach((element) => {
        if (element.filingType.includes('Stip')) {
          stipCount++;
        }
      });
      return stipCount;
    },
    countsExpungedNC: function () {
      return this.saved.counts.filter(
        (count) =>
          count.filingType === 'ExNC' || count.filingType === 'StipExNC'
      );
    },
    countsExpungedC: function () {
      return this.saved.counts.filter(
        (count) => count.filingType === 'ExC' || count.filingType === 'StipExC'
      );
    },
    countsExpungedNCrim: function () {
      return this.saved.counts.filter(
        (count) =>
          count.filingType === 'ExNCrim' || count.filingType === 'StipExNCrim'
      );
    },
    countsSealC: function () {
      return this.saved.counts.filter(
        (count) => count.filingType === 'SC' || count.filingType === 'StipSC'
      );
    },
    countsSealDui: function () {
      return this.saved.counts.filter(
        (count) =>
          count.filingType === 'SDui' || count.filingType === 'StipSDui'
      );
    },
    /* Checks the computed `filings` property to see how many unique dockets there are */
    numDockets: function () {
      const dockets = this.filings
        .map((f) =>
          f.filings
            .map((f2) => f2.docketNums.map((d) => d.string).flat())
            .flat()
        )
        .flat();
      const uniqueDockets = dockets.reduce((acc, n) => {
        if (!acc.includes(n)) {
          acc.push(n);
        }
        return acc;
      }, []);
      return uniqueDockets.length;
    },
    csvFilename: function () {
      var date = new Date();
      return this.slugify(
        'filings for ' +
        this.petitioner.name +
        ' ' +
        date.toDateString() +
        '.csv'
      );
    },
    csvData: function () {
      return this.saved.counts.map(function (count) {
        return {
          Petitioner_Name: this.petitioner['name'],
          Petitioner_DOB: this.petitioner.dob,
          Petitioner_Address: this.petitioner.addressString,
          Petitioner_Phone: this.responses.phone,
          County: count.county,
          Docket_Sheet_Number: count.docketSheetNum,
          Count_Docket_Number: count.docketNum,
          Filing_Type: this.filingNameFromType(count.filingType),
          Count_Description: count.description,
          Count_Statute_Title: count.titleNum,
          Count_Statute_Section: count.sectionNum,
          Offense_Class: this.offenseAbbreviationToFull(count.offenseClass),
          Offense_Disposition: count.offenseDisposition,
          Offense_Disposition_Date: count.dispositionDate,
        };
      });
    },
    todayDate: function () {
      date = moment().format('MMMM D[, ]YYYY');
      return date;
    },
  },
  filters: {
    uppercase: function (value) {
      if (!value) return '';
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
    lowercase: function (value) {
      if (!value) return '';
      value = value.toString();
      return value.charAt(0).toLowerCase() + value.slice(1);
    },
    sinceNow: function (value) {
      if (!value) return '';

      let fromTime = moment(value).diff(moment(), 'milliseconds');
      let duration = moment.duration(fromTime);
      let years = duration.years() / -1;
      let months = duration.months() / -1;
      let days = duration.days() / -1;
      if (years > 0) {
        var Ys = years == 1 ? years + 'y ' : years + 'y ';
        var Ms = months == 1 ? months + 'm ' : months + 'm ';
        return Ys + Ms;
      } else {
        if (months > 0) return months == 1 ? months + 'm ' : months + 'm ';
        else return days == 1 ? days + 'd ' : days + 'd ';
      }
    },
    dateFormatSimple: function (value) {
      if (!value) return '';
      return moment(value).format('MM/DD/YYYY');
    },
    toCountyCode: function (value) {
      if (!value) return '';
      return countyCodeFromCounty(value);
    },

    /** Takes an array of filings and figures out how many there are after omitting the NOAs
     * @param array   An array of filings
     * @return int    The number of filings that are not NOAs
     */
    numWithoutNOAs: function (filings) {
      return filings.filter((f) => {
        if (
          f.type == 'NoA' ||
          f.type == 'feeWaiver' ||
          f.type == 'feeWaiverAffidavit'
        ) {
          return false;
        } else {
          return true;
        }
      }).length;
    },
    returnFine: function (fileId) {
      //TODO Handle returning number of filings and fee waivers
      fileId = fileId.replace('Affidavit', '');
      docket = 'NoA-' + fileId.substring(fileId.indexOf('-') + 1);
      let fine = parseFloat(this.responses[docket + '-fine']).toFixed(2);
      return fine;
    },
    returnSurcharge: function (fileId) {
      //TODO Handle returning number of filings and fee waivers
      fileId = fileId.replace('Affidavit', '');
      docket = 'NoA-' + fileId.substring(fileId.indexOf('-') + 1);
      let surcharge = parseFloat(this.responses[docket + '-surcharge']).toFixed(
        2
      );
      return surcharge;
    },
    stringAgeInYearsAtDate: function (date, dob) {
      if (!date) return '';
      if (!dob) return '';
      let fromTime = moment(date).diff(moment(dob));
      let duration = moment.duration(fromTime);
      return (duration.asDays() / 365.25).toFixed(0) + ' yo';
    },
  },
}
</script>

<template>
  <div id="coverDiv" class="empty-state" v-if="saved.counts.length == 0">
    <div id="logoDivCover">
      <img
        id="code4btv"
        src="/images/code4BTV-logo-300-300.png"
        alt="Home"
        class="logos"
      />
      <img
        id="legal-aid"
        src="/images/VLA_logo-200-97px.png"
        alt="Home"
        class="logos"
      />
    </div>
    <div class="popup-edition-wrap">
      <p class="popup-edition">ExpungeVT 4.1.1 - Co-counsel Edition</p>
      <p class="popup-edition-sub">Expunge Harder. Expunge Smarter.</p>
    </div>
    <div class="inset text-center button-div">
      <button
        v-on:click="addDocketCounts"
        class="add-docket-info btn btn-primary"
      >
        Add From Page <i class="fas fa-plus-circle"></i>
      </button>
      <button
        v-on:click="loadCaseFile"
        class="add-docket-info btn btn-primary"
      >
        Load Case File<br /><i class="fas fa-file"></i>
      </button>
      <button
        v-on:click="addAndOpenManagePage"
        class="edit-counts btn btn-primary"
      >
        Add/Edit <i class="fas fa-edit"></i>
      </button>
    </div>
    <p v-if="popupHeadline != ''" id="introText" v-html="popupHeadline"></p>
    <p v-else></p>
    <a
      id="vtCourtsOnlineA"
      class="title-page__link"
      target="_blank"
      href="https://publicportal.courts.vt.gov/Portal"
    >
      <p id="vtCourtsOnline">
        <b
          >Vermont Judiciary Public Portal
          <i class="fas fa-external-link-alt"></i
        ></b>
      </p>
    </a>
    <a target="_blank" href="disclaimer.html" class="title-page__link">
      <p>Terms &amp; Conditions <i class="fas fa-external-link-alt"></i></p>
    </a>
    <div class="donate-box">
      <a
        class="edit-counts btn btn-success donate title-page__link"
        href="https://www.paypal.com/paypalme/c4btv"
        target="_blank"
      >
        Donate to Code for BTV!&nbsp;&nbsp;&nbsp;<i
          class="fas fa-hand-holding-usd"
        ></i>
      </a>
    </div>
  </div>
  <div class="active-state" v-else>
    <div class="popTop">
      <div id="defendantInfo">
        <div class="pet-item">
          <p class="section-label">Petitioner Information</p>
        </div>
        <div class="pet-item">
          <p class="pet-label">Name:</p>
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="saved.defName"
          />
        </div>
        <div class="pet-item">
          <p class="pet-label">DOB:</p>
          <input
            class="form-control form-control-sm"
            type="date"
            v-model="saved.defDOB"
          />
        </div>
        <div class="pet-item">
          <p class="pet-label">Address:</p>
          <textarea
            class="form-control form-control-sm"
            v-model="saved.defAddress"
            placeholder="e.g. 123 Main Street"
          ></textarea>
        </div>
        <div class="pet-item">
          <p class="pet-label">Email:</p>
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="saved.defEmail"
          />
        </div>
      </div>
      <div id="logoDiv">
        <button
          v-on:click="confirmClearData"
          class="clear-data btn btn-outline-secondary"
        >
          Clear All
        </button>
        <img
          alt="Home"
          class="logos"
        />
        <img
          alt="Home"
          class="logos"
        />
      </div>
    </div>
    <div class="pet-item pet-label-info">
      <span>
        <a
          class=""
          data-toggle="collapse"
          href="#bugWarning"
          role="button"
          aria-expanded="false"
          aria-controls="bugWarning"
        >
          <i class="fas fa-exclamation-triangle"></i>
          Issues and Bugs?
        </a>
      </span>
      <div class="collapse" id="bugWarning">
        <div class="card card-body">
          Closing all petition windows (without closing browser) may help
          stop unexpected behavior. Save your file in the petitions screen
          before closing the browser, and try restarting the browser. If you
          are still experiencing issues, contact
          <a href="https://codeforbtv.org/contact/" target="_blank"
            >Code for BTV for assistance.</a
          >
        </div>
      </div>
    </div>
    <div class="popTop inset text-center bottom-div">
      <div class="inset text-center button-div">
        <button v-on:click="addDocketCounts" class="btn btn-primary">
          Add From Page <i class="fas fa-plus-circle"></i>
        </button>
        <button
          v-on:click="openManagePage"
          data-edit-counts
          class="edit-counts btn btn-primary"
        >
          Add/Edit <i class="fas fa-edit"></i>
        </button>
        <button v-on:click="openPetitionsPage" class="btn btn-success">
          Petitions <i class="fas fa-external-link-alt"></i>
        </button>
      </div>
    </div>
    <p id="runningCount" class="section-label">
      Counts ({{saved.counts.length}})
    </p>
    <div id="countCards" class="count-cards inset text-center">
      <!-- begin card -->

      <div
        class="card"
        v-bind:id="count.uid"
        v-for="(count, index) in saved.counts"
      >
        <div class="card-header">
          <div class="card-header__column">
            <div class="card-header__title-row">
              <div id="description-date" class="card-header__meta-data">
                <div class="card-header__description btn btn-link btn-sm">
                  <p v-if="count.docketNum">
                    <b>
                      <a v-bind:href="count.url" target="_blank">
                        {{count.docketNum}} {{count.county | toCountyCode
                        }}</a
                      ></b
                    >
                  </p>
                  <p v-if="count.description">
                    <b>{{count.description}}</b>
                  </p>
                </div>
                <p
                  class="card-header__disposition-date"
                  v-if="count.dispositionDate"
                >
                  Est. Disposition: {{count.dispositionDate |
                  dateFormatSimple}} ({{count.dispositionDate | sinceNow}}
                  ago)
                </p>
              </div>
              <div class="card-header__select">
                <select
                  v-model="count.filingType"
                  class="form-control form-control-sm petitionSelect selectpicker"
                >
                  <option value="X">No Filing</option>
                  <option value="ExC">Expunge Conviction</option>
                  <option value="ExNC">Expunge Non-Conviction</option>
                  <option value="ExNCrim">Expunge Non-Criminal</option>
                  <option value="SC">Seal Conviction</option>
                  <option value="SDui">Seal DUI</option>
                  <option value="StipExC">(Stip) Expunge Conviction</option>
                  <option value="StipExNC"
                    >(Stip) Expunge Non-Conviction</option
                  >
                  <option value="StipExNCrim"
                    >(Stip) Expunge Non-Criminal</option
                  >
                  <option value="StipSC">(Stip) Seal Conviction</option>
                  <option value="StipSDui">(Stip) Seal DUI</option>
                </select>
              </div>
            </div>
            <div class="card-header__bottom-row">
              <pills-row
                v-bind:count="count"
                v-bind:dob="saved.defDOB"
              ></pills-row>
            </div>
          </div>
        </div>

        <div class="collapse-section">
          <div class="card-body">
            <p>County:&nbsp;{{count.county}}</p>

            <p v-if="count.titleNum || count.sectionNum">
              Statute:&nbsp;{{count.titleNum}} V.S.A.
              <span
                v-html="'&nbsp;&sect; ' + count.sectionNum "
                v-if="count.sectionNum"
              ></span
              >&nbsp;({{count.offenseClass}})
            </p>
            <p>
              Disposition:&nbsp;{{count.offenseDisposition}}
              <span v-if="!count.offenseDisposition"
                >Check Docket Sheet</span
              >
            </p>
            <div class="row text-left">
              <div class="col-4">
                Offense Date:<br />
                <span v-if="!count.allegedOffenseDate"
                  >&nbsp;Not Entered</span
                >
                <span v-else
                  >{{count.allegedOffenseDate | dateFormatSimple}}
                  ({{count.allegedOffenseDate |
                  stringAgeInYearsAtDate(saved.defDOB)}})</span
                >
              </div>
              <div class="col-4">
                Arrest/Citation Date:<br />
                <span v-if="!count.arrestCitationDate"
                  >&nbsp;Not Entered</span
                >
                <span v-else
                  >{{count.arrestCitationDate | dateFormatSimple}}
                  ({{count.arrestCitationDate |
                  stringAgeInYearsAtDate(saved.defDOB)}})</span
                >
              </div>
              <div class="col-4">
                Disposition Date:<br />
                <span v-if="!count.dispositionDate">&nbsp;Pending</span>
                <span v-else
                  >{{count.dispositionDate | dateFormatSimple}}
                  ({{count.dispositionDate |
                  stringAgeInYearsAtDate(saved.defDOB)}})</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end card -->
    </div>
    <div id="bottomText" class="inset text-center bottom-div">
      <p>
        ExpungeVT is a Code for BTV product developed in coordination with
        Vermont Legal Aid.
        <span class="reset-settings" v-on:click="resetSettings"
          ><b>Reset Settings</b></span
        >
      </p>
    </div>
  </div>
</template>
