const maxCountsOnNoA = 10;
Vue.config.devtools = true;

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
    var storageChange = changes['counts'];
    if (storageChange === undefined) return;
    if (storageChange.newValue === undefined) {
      app.clearAll();
      return;
    }
    app.loadAll(function () {});
  });
}

function initScrollDetection() {
  //initates the scrollspy for the filing-nav module.
  var spy = new Gumshoe('#filing-nav a', {
    nested: true,
    nestedClass: 'active-parent',
    offset: 200, // how far from the top of the page to activate a content area
    reflow: true, // if true, listen for reflows
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

function countyNameFromCountyCode(countyCode) {
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

//Vue app
var app = new Vue({
  el: '#filing-app',
  data: {
    settings: {
      attorney: '',
      attorneyAddress: '',
      attorneyPhone: '',
      footer1: '- Generated by ExpungeVT -',
      footer2: '- A Code for BTV Project -',
      customNote: '',
      role: 'AttyConsult',
      forVla: true,
    },
    saved: {
      defName: '',
      defAddress: [''],
      defDOB: '',
      counts: [],
    },
    groupCounts: false,
    groupNoas: false,
    responses: {},
    countiesContact: {},
    popupHeadline: '',
    roleCoverLetterText: {},
    coverLetterContent: {},
    stipDef: {},
  },
  watch: {
    // Affects "consolidation" checkboxes in filings page header
    // This watch ensures that "NoAs" checkbox IS checked when "Petitions" checkbox is checked
    groupCounts: {
      handler(value) {
        if (value) {
          this.groupNoas = true;
        }
      },
    },
    // Affects "consolidation" checkboxes in filings page header
    // This watch ensures that "Petitions" checkbox IS NOT checked when unchecking "NoAs" checkbox
    groupNoas: {
      handler(value) {
        if (!value) {
          this.groupCounts = false;
        }
      },
    },
    responses: {
      handler() {
        app.saveResponses();
      },
      deep: true,
    },
    settings: {
      handler() {
        this.saveSettings();
        app.$nextTick(function () {
          //vanilla js
        });
      },
      deep: true,
    },
    saved: {
      handler() {
        devLog('counts updated');
        this.saveCounts();
        app.$nextTick(function () {
          //call any vanilla js functions after update.
          //initAfterFilingRefresh();
        });
      },
      deep: true,
    },
  },
  beforeCreate() {
    $.getJSON(
      'https://raw.githubusercontent.com/codeforbtv/expungeVT-admin/master/config/adminConfig.json',
      function (data) {
        this.countiesContact = data['countyContacts'];
        this.popupHeadline = data['expungeHeadline'];
        this.roleCoverLetterText = data['roleText'];
        this.coverLetterContent = data['letter'];
        this.stipDef = data['stipDefinition'];
        devLog('adminConfig data has been set: ');
        devLog(data);
      }.bind(this)
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
      // devLog("save settings", app.settings)
      settingString = JSON.stringify(this.settings);
      localStorage.setItem('localExpungeVTSettings', settingString);
    },
    saveResponses: function () {
      devLog('save responses');
      chrome.storage.local.set({
        responses: app.responses,
      });
    },
    saveCounts: function () {
      devLog('saving counts');
      chrome.storage.local.set({
        counts: app.saved,
      });
    },
    loadAll: function (callback) {
      if (callback === undefined) {
        callback = function () {};
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
          app.saved = result.counts;
        }

        if (result.responses !== undefined) {
          app.responses = result.responses;
        }

        callback();
        app.$nextTick(function () {
          //call any vanilla js functions that need to run after vue is all done setting up.
          initAfterVue();
        });
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
        const filingsWithNOAs = this.groupNoas
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
          lastCounty = currCounty;
        }

        // always copy over the filings to new array
        filingsWithNOAs.push(thisFiling);
      }
      return filingsWithNOAs;
    },

    /*
     * Inserts an NOA each time the docket changes in the array of filings.
     * @param {object} filings      An array of filing objects that needs some NOAs added to it
     */
    insertNOAsForEachDocket: function (filings) {
      let lastDocketNum = '';
      let filingsWithNOAs = [];

      // loop over all the filings
      for (var i = 0; i < filings.length; i++) {
        const thisFiling = filings[i];
        const currDocketNum = thisFiling.docketNums[0].string;

        // Conditionally insert a NOA at the beginning of each new string of docket petitions
        if (lastDocketNum != currDocketNum) {
          const docketCounts = filings
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
          lastDocketNum = currDocketNum;
        }

        // always copy over the filings to new array
        filingsWithNOAs.push(thisFiling);
      }
      return filingsWithNOAs;
    },

    createResponseObjectForFiling: function (id) {
      if (app.responses[id] === undefined) {
        Vue.set(app.responses, id, '');
      }
    },

    /*
     * Helper function to make a "Notice of Appearance" object that can be
     * inserted into arrays of filings.
     */
    createNOAFiling: function (county, counts) {
      return this.makeFilingObject(counts, 'NoA', county);
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
          county: count.docketCounty,
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
    filingNameFromType: function (filingType) {
      switch (filingType) {
        case 'NoA':
          return 'Notice of Appearance';
        case 'StipExC':
          return 'Stipulated Petition to Expunge Conviction';
        case 'ExC':
          return 'Petition to Expunge Conviction';
        case 'StipExNC':
          return 'Stipulated Petition to Expunge Non-Conviction';
        case 'ExNC':
          return 'Petition to Expunge Non-Conviction';
        case 'StipExNCrim':
          return 'Stipulated Petition to Expunge Conviction';
        case 'ExNCrim':
          return 'Petition to Expunge Conviction';
        case 'StipSC':
          return 'Stipulated Petition to Seal Conviction';
        case 'SC':
          return 'Petition to Seal Conviction';
        case 'StipSDui':
          return 'Stipulated Petition to Seal Conviction';
        case 'SDui':
          return 'Petition to Seal Conviction';
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
      Vue.delete(app.saved.counts, index);
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
            url: chrome.extension.getURL('./filings.html'),
            index: index + 1,
          });
        }
      );
    },
    addAndOpenManagePage: function () {
      if (this.saved.counts.length == 0) {
        this.newCount();
        Vue.set(app.saved, 'defName', 'New Petitioner');
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
            url: chrome.extension.getURL('./manage-counts.html'),
            index: index + 1,
          });
        }
      );
    },
    addDocketCounts: function () {
      // TODO: consider using content_scripts instead to avoid loading payload.js every time the
      // 'Add From Page' button is clicked.
      // see: https://stackoverflow.com/a/42989406/263900
      chrome.tabs.executeScript(null, { file: 'payload.js' });
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
    exportContent: function () {
      downloadCSV({ data_array: app.csvData, filename: app.csvFilename });
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
  },
  computed: {
    petitioner: function () {
      return {
        name: this.saved.defName,
        dob: this.saved.defDOB,
        address: this.nl2br(this.saved.defAddress),
      };
    },
    filings: function () {
      var shouldGroupCounts =
        this.groupCounts !== undefined ? this.groupCounts : true;
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
      return this.groupNoAction(app.saved.counts);
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
          app.petitioner.name +
          ' ' +
          date.toDateString() +
          '.csv'
      );
    },
    csvData: function () {
      return this.saved.counts.map(function (count) {
        return {
          Petitioner_Name: app.petitioner['name'],
          Petitioner_DOB: app.petitioner.dob,
          Petitioner_Address: app.petitioner.addressString,
          Petitioner_Phone: app.responses.phone,
          County: count.county,
          Docket_Sheet_Number: count.docketSheetNum,
          Count_Docket_Number: count.docketNum,
          Filing_Type: app.filingNameFromType(count.filingType),
          Count_Description: count.description,
          Count_Statute_Title: count.titleNum,
          Count_Statute_Section: count.sectionNum,
          Offense_Class: app.offenseAbbreviationToFull(count.offenseClass),
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
  },
});
