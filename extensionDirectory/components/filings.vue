<script>
import $ from 'jquery';
import dayjs from 'dayjs';
import 'bootstrap';
import 'bootstrap4-toggle';
import { nextTick, toRaw } from 'vue';
import checkoutOffenseRow from './checkout-offense-row.vue';
import docketCaption from './docket-caption.vue';
import filingDatedCity from './filing-dated-city.vue';
import filingFooter from './filing-footer.vue';
import filingNav from './filing-nav.vue';
import filingTypeHeading from './filing-type-heading.vue';
import { storeToRefs } from 'pinia';

import {
  confirmClearData,
  confirmDeleteCount,
  createFilingsFromCounts,
  csvData,
  countyCodeFromCounty,
  dateFormatSimple,
  detectChangesInChromeStorage,
  devLog,
  getError,
  handleNewDocketNums,
  handlePrintMacro,
  initAfterVue,
  initScrollDetection,
  initTextAreaAutoExpand,
  initSmoothScroll,
  linesBreaksFromArray,
  loadAll,
  lowercase,
  makeFilingObject,
  maxDate,
  nl2br,
  openManagePage,
  openPetitionsPage,
  saveCounts,
  saveHtml,
  saveResponses,
  saveSettings,
  setInitialExpandForTextAreas,
  sinceNow,
  slugify,
  stringAgeInYearsAtDate,
  toCountyCode,
  todayDate,
  uppercase,
} from '../utils';

import { useDataStore } from '../store.mjs';

export default {
  // el: '#filing-app',
  components: {
    checkoutOffenseRow,
    docketCaption,
    filingDatedCity,
    filingFooter,
    filingNav,
    filingTypeHeading,
  },
  data() {
    return {
      settings,
      saved,
      responses,
      fees,
      fines,
      countiesContact,
      popupHeadline,
      roleCoverLetterText,
      coverLetterContent,
      stipDef,
    } = storeToRefs(useDataStore());
  },
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
        devLog('counts updated - line:' + getError());
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
        this.countiesContact = data['countyContacts'];
        this.popupHeadline = data['expungeHeadline'];
        this.roleCoverLetterText = data['roleText'];
        this.coverLetterContent = data['letter'];
        this.stipDef = data['stipDefinition'];
        devLog(
          'adminConfig data has been set in filings.vue at line: ' + getError()
        );
        devLog(data);
      }.bind(this)
    );
  },
  mounted() {
    devLog('App mounted!');
    this.loadAll();
    detectChangesInChromeStorage(this, false);
    handlePrintMacro(this);
    initAfterVue();
    //This is to make sure dynamically created table are unique across tab in order to avoid errors
    this.uniqueId = this._uid;
  },
  updated() {
    nextTick(function () {
      // call any vanilla js functions that need to run after vue is all done setting up.
      initScrollDetection();
      setInitialExpandForTextAreas();
      initTextAreaAutoExpand();
      initSmoothScroll();
    });
  },
  methods: {
    saveSettings: function() {
      saveSettings(this.settings)
    },
    saveResponses: function() {
      saveResponses(this.responses)
    },
    saveCounts: function() {
      saveCounts(toRaw(this.saved))
    },
    handleNewDocketNums: handleNewDocketNums,
    loadAll: function (callback) {
      loadAll(this, callback);
    },

    /**
     * Creates the petition filings (including NOAs) from collected counts
     *
     * @param {Object} counts Count objects used to generate petitons
     * @param {boolean} groupDockets Indicates whether to consolidate dockets into single petitons
     */
    createFilingsFromCounts: function (counts, groupDockets = true) {
      return createFilingsFromCounts(this, counts, groupDockets);
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
      for (let i = 0; i < filings.length; i++) {
        const thisFiling = filings[i];
        const currCounty = thisFiling.county;

        // when the county changes, insert a NOA
        if (lastCounty != currCounty) {
          const docketCounts = filings
            .filter((f) => f.county == currCounty)
            .map((f) => f.counts)
            .flat();
          const noa = this.createNOAFiling(currCounty, docketCounts);
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
      let sortedFilings = filings.sort((a, b) =>
        a.docketNums[0].num > b.docketNums[0].num ? 1 : -1
      );

      // loop over all the sortedFilings
      for (let i = 0; i < sortedFilings.length; i++) {
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
      return makeFilingObject(counts, 'NoA', county);
    },
    createFeeFiling: function (county, counts) {
      return makeFilingObject(counts, 'feeWaiver', county);
    },
    createFeeFilingAffidavit: function (county, counts) {
      return makeFilingObject(counts, 'feeWaiverAffidavit', county);
    },
    groupIneligibleCounts: function (counts) {
      let ineligibleCounts = counts.filter((count) => count.filingType == 'X');
      return ineligibleCounts;
    },
    groupNoAction: function (counts) {
      let noActionCounts = counts.filter((count) => count.filingType == '');
      return noActionCounts;
    },
    newCount: function (event) {
      this.saved.counts.push({ description: 'New', filingType: '' });
    },
    confirmDeleteCount: function (event, countId) {
      confirmDeleteCount(this, event, countId);
    },
    nl2br: nl2br,
    linesBreaksFromArray: linesBreaksFromArray,
    openPetitionsPage: openPetitionsPage,
    addAndOpenManagePage: function () {
      if (this.rawCounts.length == 0) {
        this.newCount();
        this.saved['defName'] = 'New Petitioner';
      }
      openManagePage();
    },
    openManagePage: openManagePage,
    addDocketCounts: function () {
      // TODO: consider using content_scripts instead to avoid loading payload.js every time the
      // 'Add From Page' button is clicked.
      // see: https://stackoverflow.com/a/42989406/263900
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['payload.js'],
        });
      });
    },
    confirmClearData: confirmClearData,
    resetSettings: function(element) {
      resetSettings(this, element);
    },
    printDocument: function () {
      window.print();
    },
    saveHtml: function() {
      saveHtml(this);
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
    stringAgeInYearsAtDate: stringAgeInYearsAtDate,
    sinceNow: sinceNow,
    dateFormatSimple: dateFormatSimple,
    toCountyCode,
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
      let shouldGroupCounts =
        this.settings.groupCounts !== undefined
          ? this.settings.groupCounts
          : true;
      return this.createFilingsFromCounts(this.rawCounts, shouldGroupCounts); //counts, groupCountsFromMultipleDockets=true
    },
    maxDate: maxDate,
    numCountsToExpungeOrSeal: function () {
      return this.rawCounts.filter((count) => count.filingType !== 'X').length;
    },
    numCountsNoAction: function () {
      return this.rawCounts.filter((count) => count.filingType === 'X').length;
    },
    ineligible: function () {
      return this.groupIneligibleCounts(this.rawCounts);
    },
    noAction: function () {
      return this.groupNoAction(this.rawCounts);
    },
    numCountsIneligible: function () {
      return this.ineligible.length;
    },
    numCountsStipulated: function () {
      let stipCount = 0;
      this.rawCounts.forEach((element) => {
        if (element.filingType.includes('Stip')) {
          stipCount++;
        }
      });
      return stipCount;
    },
    countsExpungedNC: function () {
      return this.rawCounts.filter(
        (count) =>
          count.filingType === 'ExNC' || count.filingType === 'StipExNC'
      );
    },
    countsExpungedC: function () {
      return this.rawCounts.filter(
        (count) => count.filingType === 'ExC' || count.filingType === 'StipExC'
      );
    },
    countsExpungedNCrim: function () {
      return this.rawCounts.filter(
        (count) =>
          count.filingType === 'ExNCrim' || count.filingType === 'StipExNCrim'
      );
    },
    countsSealC: function () {
      return this.rawCounts.filter(
        (count) => count.filingType === 'SC' || count.filingType === 'StipSC'
      );
    },
    countsSealCAdult: function () {
      return this.rawCounts.filter(
        (count) =>
          count.filingType === 'SCAdult' || count.filingType === 'StipSCAdult'
      );
    },
    countsSealDui: function () {
      return this.rawCounts.filter(
        (count) =>
          count.filingType === 'SDui' || count.filingType === 'StipSDui'
      );
    },
    countsSealNegOp: function () {
      return this.rawCounts.filter(
        (count) =>
          count.filingType === 'NegOp' || count.filingType === 'StipNegOp'
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
    csvData: function () {
      csvData(this);
    },
    todayDate: todayDate,
    rawCounts: function () {
      return toRaw(this.saved.counts);
    },
  },
  filters: {
    uppercase: uppercase,
    lowercase: lowercase
  },
};
</script>

<template>
    <div
        class="modal fade"
        id="exampleModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLabel">Settings</h5>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <p>
                <span class="modal-title">Attorney / Preparer Name:</span>
                <input
                  class="no-print"
                  id="attorneyName"
                  v-model="settings['attorney']"
                  placeholder="Attorney Name"
                />
              </p>
              <p>
                <span class="modal-title">Address:</span>
                <textarea
                  class="no-print"
                  v-model="settings['attorneyAddress']"
                  placeholder="Attorney Address"
                ></textarea>
              </p>
              <p>
                <span class="modal-title">Phone:</span>
                <input
                  class="no-print"
                  id="attorneyPhone"
                  v-model="settings['attorneyPhone']"
                  placeholder="Attorney Phone Number"
                />
              </p>
              <label class="card-header__select">
                <p>
                  <label class="card-header__select roleSelect">
                    <span class="modal-title">Preparer Role:</span>
                    <select
                      class="form-control form-control-sm selectpicker"
                      v-model="settings.role"
                    >
                      <option value="AttyConsult">
                        Attorney: Consult only with no appearance
                      </option>
                      <option value="AttyAppear">
                        Attorney: Appearance to be entered
                      </option>
                      <option value="AdminAssist">
                        Administrative assistance only
                      </option>
                      <option value="StateAtty">
                        State's Attorney or AG Preparer
                      </option>
                    </select>
                  </label>
                </p>
                <p>
                  <label class="modal-vla-check">
                    <span class="modal-title">VLA Logo & Footer:</span>
                    <input type="checkbox" v-model="settings.forVla" />
                  </label>
                </p>
              </label>
              <div class="custom-footer-block" v-if="!settings.forVla">
                <span class="modal-title">Custom Footer:</span>
                <input
                  class="no-print footer__input"
                  v-model="settings['footer1']"
                  placeholder="- Code for BTV -"
                />
                <input
                  class="no-print footer__input"
                  v-model="settings['footer2']"
                  placeholder="- Code for BTV -"
                />
              </div>
              <div class="consolidate-options" v-if="numDockets > 1">
                <span><b>Consolidate by county: </b></span>
                <label>
                  NoA
                  <input type="checkbox" v-model="settings.groupNoas" />
                </label>
                <label>
                  <span
                    >Petitions
                    <input type="checkbox" v-model="settings.groupCounts"
                  /></span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- If there are filings to dispalay... -->
      <div v-if="(numCountsToExpungeOrSeal + numCountsNoAction) > 0">
        <!-- Page header & page actions -->
        <div class="header-bar-wrapper no-print">
          <div class="header-bar">
            <h1 v-if="petitioner.name" >Filings for {{petitioner.name}}</h1>
            <div class="header-bar__controls">
              <div v-if="numDockets >= 1 && proSeFromRole(settings.role)">
                <span
                  >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b
                    >E-mail Consent:
                  </b></span
                >
                <label>
                  <input type="checkbox" v-model="settings.emailConsent" />
                </label>
              </div>
              <div v-if="notarizableFilings(filings)">
                <span
                  >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b
                    >Fee Affidavits Required:
                  </b></span
                >
                <label>
                  <input type="checkbox" v-model="settings.affidavitRequired" />
                </label>
              </div>
              <button
                v-on:click="printDocument"
                class="btn btn-primary no-print"
              >
                Print All
              </button>
              <button v-on:click="saveHtml" class="btn btn-primary no-print">
                Save
              </button>
              <a href="manage-counts.html" class="edit-counts btn btn-primary"
                >Add/Edit Counts <i class="fas fa-edit"></i
              ></a>
              <button
                type="button"
                class="btn btn-primary"
                data-toggle="modal"
                data-target="#exampleModal"
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        <filing-nav v-bind="{'filings':filings, 'settings':settings}"></filing-nav>

        <!-- Cover letter & checkout sheet wrapper -->
        <table class="extra-pages">
          <tbody>
            <tr>
              <td>
                <section class="no-print disclaimer-message">
                  Verify documents below against docket sheet to confirm
                  information is accurate and complete. <br /><a
                    href="disclaimer.html"
                    target="_blank"
                    >Terms and Conditions.</a
                  >
                </section>

                <!-- Begin Cover Sheet -->
                <section class="extra-documents-top" id="extra-documents">
                  <!-- Client Cover Letter -->
                  <article class="page" id="clinic-checkout">
                    <div class="document-meta-data no-print">
                      <p class="document-meta-data__title">Cover Letter</p>
                      <p class="document-meta-data__body">
                        {{numCountsToExpungeOrSeal}} counts to file,
                        {{numCountsNoAction}} counts with no action taken
                      </p>
                    </div>
                    <div class="filing-document">
                      <div class="filing-body">
                        <div class="title petition__title"></div>
                        <div class="from-block">
                          <img
                            v-if="settings.forVla"
                            class="vla-logo"
                            src="images/VLA_logo-200-97px.png"
                          />
                          <img
                            v-else
                            class="generic-logo"
                            src="images/icon_128.png"
                          />
                          <div class="atty-block">
                            <p
                              class="filing-closing__petitioner-address"
                              v-html="nl2br(settings['attorney']+'\n'+settings['attorneyAddress'])"
                            ></p>
                          </div>
                        </div>
                        <br />
                        <div class="to-date-block">
                          <div class="to-block">
                            <h1>{{petitioner.name}}</h1>
                            <p>
                              <span
                                class="filing-closing__petitioner-address"
                                v-html="petitioner.address"
                              ></span
                              ><span class="no-visible"
                                ><br />{{responses['phone']}}</span
                              >
                            </p>
                            <p class="no-print">
                              Phone:
                              <input
                                v-model="responses['phone']"
                                placeholder="Petitioner Phone Number"
                              />
                            </p>
                          </div>
                          <p class="date-block">{{todayDate}}</p>
                        </div>

                        <br />
                        <p>
                          <b>&emsp;&emsp;Re: Expungement/Sealing Summary</b>
                        </p>
                        <br />
                        <p>Dear {{petitioner.name}}:</p>
                        <p>
                          Thank you for meeting with me to discuss your legal
                          options for clearing your criminal record. We have
                          prepared the following
                          <span v-if="filings.length > 0">documents</span
                          ><span v-else>document</span> for you today:
                        </p>
                        <ul>
                          <li>Client Checkout Sheet</li>
                          <span
                            v-for="group in filings"
                            v-bind:id="group.county"
                          >
                            <li>
                              {{numWithoutNOAs(group.filings)}}
                              <span v-if="group.filings.length > 2"
                                >petitions</span
                              ><span v-else>petition</span> for {{group.county}}
                              County<span
                                v-if="returnCountyContact(group.county) != null && returnCountyContact(group.county) != ''"
                              >
                                ({{returnCountyContact(group.county)}})</span
                              >
                            </li>
                            <li
                              v-if="numOfFeeWaiversInGroup(group.filings) > 0"
                            >
                              <span
                                v-if="numOfFeeWaiversInGroup(group.filings) == 1"
                                >One fee waiver and supporting sworn statement
                                for {{group.county}} county.</span
                              ><span
                                v-if="numOfFeeWaiversInGroup(group.filings) > 1"
                                >{{numOfFeeWaiversInGroup(group.filings)}} fee
                                waivers for {{group.county}} county and a
                                supporting sworn statement for each.</span
                              >
                            </li>
                          </span>
                        </ul>
                        <p>
                          The client checkout sheet provides greater detail on
                          the criminal history we reviewed. We only reviewed the
                          information available to us and this may not include
                          your entire history.
                        </p>
                        <textarea
                          class="custom-note no-print"
                          v-model="settings['customNote']"
                          placeholder="Enter custom text"
                        ></textarea>
                        <p
                          class="no-visible"
                          v-html="settings['customNote']"
                        ></p>
                        <p
                          v-if="settings.role == 'AttyConsult'"
                          v-html="roleCoverLetterText['attyConsult']"
                        ></p>
                        <p
                          v-if="settings.role == 'AttyAppear'"
                          v-html="roleCoverLetterText['attyAppear']"
                        ></p>
                        <p
                          v-if="settings.role == 'AdminAssist'"
                          v-html="roleCoverLetterText['adminAssist']"
                        ></p>
                        <p
                          v-if="settings.role == 'StateAtty'"
                          v-html="roleCoverLetterText['stateAssist']"
                        ></p>
                        <p>
                          Please feel free to get in touch if you have any
                          questions.
                        </p>
                        <p>Sincerely,</p>
                        <p>{{settings['attorney']}}</p>
                      </div>
                    </div>
                  </article>

                  <!-- Client Checkout Sheet -->
                  <article class="page" id="client-checkout">
                    <div class="document-meta-data no-print">
                      <p class="document-meta-data__title">Checkout Sheet</p>
                      <p class="document-meta-data__body">
                        {{numCountsToExpungeOrSeal}} counts to file,
                        {{numCountsNoAction}} counts with no action taken
                      </p>
                    </div>
                    <div class="filing-document">
                      <div class="filing__title">Client Checkout Sheet</div>
                      <div class="filing-body">
                        <div class="title petition__title"></div>
                        <div class="client-checkout-header filing-header">
                          <div
                            class="client-checkout-header-left filing-header__half"
                          >
                            {{petitioner.name}}
                            <br />
                            (DOB: {{dateFormatSimple(petitioner.dob)}})
                            <br />
                            <span
                              v-if="responses['phone'] !=''"
                              class="filing-closing__phone"
                              >Phone: {{responses['phone']}}
                            </span>
                          </div>
                          <div class="client-checkout-header-right">
                            <p v-if="numCountsStipulated > 0">
                              <span
                                ><i class="fas fa-handshake"></i>&nbsp;</span
                              >
                              <span v-html="stipDef" />
                            </p>
                          </div>
                        </div>
                        <dl>
                          <table class="table summary-table">
                            <col width="300" />
                            <thead class="">
                              <th scope="col">Desc.</th>
                              <th scope="col" colspan="1">Disposition</th>
                              <th scope="col">Docket #</th>
                            </thead>
                            <tbody>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsExpungedC.length > 0"
                              >
                                CONVICTION petitions drafted:
                              </th>
                              <checkout-offense-row
                                v-if="countsExpungedC.length > 0"
                                v-bind:key="countsExpungedC + uniqueId + idx"
                                v-for="(filing, idx) in countsExpungedC"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsExpungedNC.length > 0"
                              >
                                NON-CONVICTION petitions drafted:
                              </th>
                              <checkout-offense-row
                                v-if="countsExpungedNC.length > 0"
                                v-bind:key="countsExpungedNC + uniqueId + idx"
                                v-for="(filing, idx) in countsExpungedNC"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsExpungedNCrim.length > 0"
                              >
                                NON-CRIME petitions drafted:
                              </th>
                              <checkout-offense-row
                                v-if="countsExpungedNCrim.length > 0"
                                v-bind:key="countsExpungedNCrim + uniqueId + idx"
                                v-for="(filing, idx) in countsExpungedNCrim"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsSealC.length > 0"
                              >
                                SEALED petitions drafted for offenses from under age of 25:
                              </th>
                              <checkout-offense-row
                                v-if="countsSealC.length > 0"
                                v-bind:key="countsSealC + uniqueId + idx"
                                v-for="(filing, idx) in countsSealC"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsSealCAdult.length > 0"
                              >
                                SEALED petitions drafted for offenses from age 25 or over:
                              </th>
                              <checkout-offense-row
                                v-if="countsSealCAdult.length > 0"
                                v-bind:key="countsSealCAdult + uniqueId + idx"
                                v-for="(filing, idx) in countsSealCAdult"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsSealDui.length > 0"
                              >
                                SEALED DUI petitions drafted:
                              </th>
                              <checkout-offense-row
                                v-if="countsSealDui.length > 0"
                                v-bind:key="countsSealDui + uniqueId + idx"
                                v-for="(filing, idx) in countsSealDui"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="countsSealNegOp.length > 0"
                              >
                                SEALED Negligent Operation petitions drafted:
                              </th>
                              <checkout-offense-row
                                v-if="countsSealNegOp.length > 0"
                                v-bind:key="countsSealNegOp + uniqueId + idx"
                                v-for="(filing, idx) in countsSealNegOp"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                              <th
                                scope="col"
                                colspan="3"
                                v-if="ineligible.length > 0"
                              >
                                NO ACTION TAKEN:
                              </th>
                              <checkout-offense-row
                                v-if="this.numCountsIneligible > 0"
                                v-bind:key="ineligible + uniqueId + idx"
                                v-for="(filing, idx) in ineligible"
                                v-bind:filing="filing"
                              ></checkout-offense-row>
                            </tbody>
                          </table>
                        </dl>
                      </div>
                    </div>
                  </article>
                </section>
                <!-- End Cover Sheet -->
              </td>
            </tr>
          </tbody>
          <!-- <tfoot class="footer-space">
            <tr>
              <td>&nbsp;</td>
            </tr>
          </tfoot> -->
        </table>
        <!-- Cover letter & checkout sheet wrapper -->

        <!-- Petition wrapper -->
        <table v-if="filings.length != 0" class="all-filings">
          <tbody>
            <tr>
              <td>
                <section v-for="group in filings" v-bind:id="group.county">
                  <!-- Generic petition heading info -->
                  <article
                    class="page"
                    v-for="filing in group.filings"
                    v-bind:id="filing.id"
                  >
                    <div class="document-meta-data no-print">
                      <p class="document-meta-data__title">{{filing.title}}</p>
                      <p class="document-meta-data__body">
                        {{group.county}}, {{filing.numCountsString}},
                        {{filing.numDocketsString}}
                      </p>
                    </div>
                    <div class="filing-document">
                      <div class="filing-header">
                        <div class="filing-header__title">State Of Vermont</div>

                        <div class="filing-header__half">
                          <div class="filing-header__court">
                            <p>Superior Court</p>
                            <p>{{filing.county}} Unit</p>
                          </div>
                          <docket-caption
                            v-bind:name="petitioner.name"
                          ></docket-caption>
                        </div>
                        <div class="filing-header__half text-right">
                          <div
                            class="filing-header__docket-number docket-number"
                          >
                            <p class="docket-number__division">
                              Criminal Division
                            </p>

                            <p
                              v-for="(docketNum, index) in filing.docketNums"
                              :key="index"
                              class="docket-number__numbers"
                            >
                              <span class="docket-number__label"
                                >Docket No.&nbsp;</span
                              ><span class="docket-number__number"
                                >{{handleNewDocketNums(docketNum.string)}}</span
                              >
                            </p>
                          </div>
                          <div
                            v-if="filing.type == 'NoA'"
                            class="no-print fee-check-box"
                          >
                            <div class="form-check form-switch">
                              <div class="switch_box box_4">
                                <div class="input_wrapper">
                                  <input
                                    type="checkbox"
                                    v-model="responses[filing.id +'-feeForm']"
                                    class="switch_4"
                                  />
                                  <svg
                                    class="is_checked"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 426.67 426.67"
                                  >
                                    <path
                                      d="M153.504 366.84c-8.657 0-17.323-3.303-23.927-9.912L9.914 237.265c-13.218-13.218-13.218-34.645 0-47.863 13.218-13.218 34.645-13.218 47.863 0l95.727 95.727 215.39-215.387c13.218-13.214 34.65-13.218 47.86 0 13.22 13.218 13.22 34.65 0 47.863L177.435 356.928c-6.61 6.605-15.27 9.91-23.932 9.91z"
                                    />
                                  </svg>
                                  <svg
                                    class="is_unchecked"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 212.982 212.982"
                                  >
                                    <path
                                      d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"
                                      fill-rule="evenodd"
                                      clip-rule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <label
                                class="form-check-label"
                                for="flexSwitchCheckChecked"
                                ><span v-if="responses[filing.id +'-feeForm']"
                                  >Fee waiver included.</span
                                ><span v-else>No Fee waiver.</span></label
                              >
                            </div>
                            <div
                              v-bind:class="[!responses[filing.id +'-feeForm'] ? 'disable-box' : '']"
                            >
                              <div class="fee-row">
                                <span class="fee-label">Fine:</span>
                                <span class="dollar">$</span
                                ><input
                                  type="number"
                                  class="no-print"
                                  :disabled="!responses[filing.id +'-feeForm']"
                                  v-model="responses[filing.id +'-fine']"
                                  v-bind:class="[!responses[filing.id +'-feeForm'] ? 'disable-box' : '']"
                                  placeholder="Type here..."
                                />
                              </div>
                              <div class="fee-row">
                                <span class="fee-label">Surcharge:</span>
                                <span class="dollar">$</span
                                ><input
                                  type="number"
                                  class="no-print"
                                  :disabled="!responses[filing.id +'-feeForm']"
                                  v-bind:class="[!responses[filing.id +'-feeForm'] ? 'disable-box' : '']"
                                  v-model="responses[filing.id +'-surcharge']"
                                  placeholder="Type here..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <h1 class="filing-title">{{filing.title}}</h1>
                      <!-- End generic petition heading info -->

                      <!-- Begin Unique Portion of Filings -->

                      <!-- Notice of Appearance -->
                      <div class="filing-body" v-if="filing.type == 'NoA'">
                      
                        <p class="indent" v-if="proSeFromRole(settings.role)">
                          NOW COMES {{petitioner.name}} (DOB: {{
                          dateFormatSimple(petitioner.dob)}}), appearing
                          <span class="italic">pro se</span>, and hereby
                          enters this notice of appearance in the above
                          captioned action.
                          <span
                            class="email-test"
                            v-if="settings.emailConsent"
                            ><br /><br />By signing this notice of appearance
                            below, I hereby agree to the acceptance of all
                            electronic filings at the following email address:
                            <b>{{petitioner.email}}</b>.</span
                          >
                          </p>
                        <p class="indent" v-else>
                          NOW COMES <span>{{settings['attorney']}}</span>, by
                          and on behalf of {{petitioner.name}} (DOB:
                          {{dateFormatSimple(petitioner.dob)}}), and hereby
                          enters this notice of appearance in the above
                          captioned action.
                        </p>
                      </div>
                      <!-- Fee Waiver -->
                      <div
                        v-bind:id="filing.id"
                        class="filing-body"
                        v-if="filing.type == 'feeWaiver'"
                      >
                            <p class="indent">
                              NOW COMES {{petitioner.name}} (DOB:
                              {{dateFormatSimple(petitioner.dob)}}),
                              <span v-if="proSeFromRole(settings.role)"
                                >appearing <span class="italic">pro se</span>
                            </span>
                              <span v-else>
                                by and through counsel,
                                <span>{{settings['attorney']}}</span> </span
                              >, and hereby moves the Court to
                              <span
                              v-if="returnSurcharge(filing.id)>0"
                                >waive surcharges </span
                              ><span
                                v-if="returnFine(filing.id)>0 && returnSurcharge(filing.id)>0"
                                >and
                              </span>
                              <span
                                v-if="returnFine(filing.id)>0"
                                >suspend the fines </span
                              >associated with the above-captioned case for the
                              reasons set forth herein.
                            <ol>
                              <li
                                v-if="returnSurcharge(filing.id)>0"
                              >
                                Pursuant to 13 V.S.A. &#167; 7282(b), surcharges
                                can be waived in an expungement or sealing
                                proceeding "where the petitioner demonstrates an
                                inability to pay."
                              </li>
                              <li
                                v-if="returnFine(filing.id)>0"
                              >
                                Pursuant to 13 V.S.A &#167; 7178 "[a] Superior
                                judge, in his or her discretion, may suspend all
                                or any part of the fine assessed against a
                                respondent."
                              </li>
                              <li
                                v-if="returnFine(filing.id)>0"
                              >
                                At the time of conviction, the court fined
                                Petitioner ${{returnFine(filing.id)}}.
                              </li>
                              <li
                                v-if="returnSurcharge(filing.id)>0"
                              >
                                At the time of conviction, the court assessed
                                Petitioner a surcharge of ${{returnSurcharge(filing.id)}}.
                              </li>
                              <li>
                                Petitioner has contemporaneously filed petition
                                for record clearance.
                              </li>
                              <li>
                                But for these legal financial obligations,
                                petitioner is eligible for relief.
                              </li>
                              <li>
                                Petitioner is unable to pay these legal
                                financial obligations.
                              </li>
                              <li>
                                Waiver of legal financial obligations would
                                further the interests of justice for the reasons
                                set forth in the attached sworn statement and
                                because the relief petitioner seeks should not
                                be barred due to economic status.
                              </li>
                            </ol>
                        </p>
                      </div>
                      <!-- Fee waiver affidavit -->
                      <div
                        class="filing-body"
                        v-bind:id="filing.id"
                        v-if="filing.type == 'feeWaiverAffidavit' && !responses[filing.id +'-feeForm']"
                      >
                        <p class="indent">
                            {{petitioner.name}}, being duly sworn, deposes and
                            says under oath:
                            <ol>
                              <li>
                                I am petitioning the Court to clear my Vermont
                                criminal record in the above referenced matter.
                              </li>
                              <li
                                v-if="returnFine(filing.id)>0"
                              >
                                I have outstanding fines totaling ${{ 
                                returnFine(filing.id) }}.
                              </li>
                              <li
                                v-if="returnSurcharge(filing.id)>0"
                              >
                                I have outstanding surcharges totaling ${{
                                returnSurcharge(filing.id) }}.
                              </li>
                              <li>
                                I do not have the means to pay this legal
                                financial debt without substantial hardship.
                              </li>
                              <li>
                                This debt is the sole remaining barrier to the
                                relief sought in this matter.
                              </li>
                              <li>
                                I respectfully ask the court to waive this
                                financial obligation so that I may clear my
                                record.
                              </li>
                            </ol>
                        </p>
                      </div>
                      <!-- (Stipulated) Petiton To Expunge Conviction -->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'ExC' || filing.type == 'StipExC'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{
                          dateFormatSimple(petitioner.dob)}}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                          </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to expunge the record of
                          the above-captioned conviction<span
                            v-if="filing.multipleCounts"
                            >s</span
                          >
                          pursuant to 13 V.S.A. &sect; 7602.
                        </p>

                        <p>
                          1. Petitioner was convicted of the following
                          crime<span v-if="filing.multipleCounts">s</span>:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">Conviction Date</th>
                            <th valign="middle" colspan="2" scope="col">
                              Offense Description
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p>
                          2. <span v-if="filing.multipleCounts">These are</span
                          ><span v-else>This is a</span> qualifying crime<span
                            v-if="filing.multipleCounts"
                            >s</span
                          >
                          pursuant to 13 V.S.A. &sect; 7601(4).
                        </p>
                        <p>
                          <span v-if="!filing.isStipulated"
                            >3. Petitioner completed the terms and conditions of
                            their sentence over 5 years ago, and paid all
                            restitution owed.</span
                          >
                        </p>
                        <p>
                          <span v-if="!filing.isStipulated">4.</span
                          ><span v-else>3. </span> Expunging all record of
                          <span v-if="filing.multipleCounts"
                            >these convictions</span
                          ><span v-else>this conviction</span> is in the
                          interests of justice because:
                        </p>
                      </div>

                      <!-- (Stipulated) Petiton To Expunge Non Conviction -->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'ExNC' || filing.type == 'StipExNC'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{
                          dateFormatSimple(petitioner.dob)}}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                          </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to expunge the record of
                          the following charge<span v-if="filing.multipleCounts"
                            >s</span
                          >
                          pursuant to 13 V.S.A. &sect; 7603.
                        </p>
                        <p>
                          1. Petitioner was charged but never convicted of the
                          following crime<span v-if="filing.multipleCounts"
                            >s</span
                          >:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">
                              Date of Dismissal
                            </th>
                            <th colspan="2" valign="middle" scope="col">
                              Charge<span v-if="filing.multipleCounts">s</span>
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p>
                          2.
                          <span v-if="filing.multipleCounts"
                            >All dismissed charges</span
                          ><span v-else>This charge is</span> eligible for
                          expungement pursuant to 13 V.S.A. &sect; 7603.
                        </p>

                        <p>
                          3. Expunging all record of
                          <span v-if="filing.multipleCounts"
                            >these dismissed charges</span
                          ><span v-else>this dismissed charge</span> serves the
                          interests of justice, as
                        </p>
                      </div>

                      <!-- (Stipulated) Petiton To Expunge Non-Crime -->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'ExNCrim' || filing.type == 'StipExNCrim'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{
                          dateFormatSimple(petitioner.dob)}}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                          </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to expunge the record of
                          the following
                          <span v-if="filing.multipleCounts">charges</span
                          ><span v-else>charge</span> pursuant to 13 V.S.A.
                          &sect; 7602(a)(1)(B).
                        </p>
                        <p>
                          1. Petitioner was convicted of the following
                          <span v-if="filing.multipleCounts">crimes</span
                          ><span v-else>crime</span>:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">Conviction Date</th>
                            <th colspan="2" valign="middle" scope="col">
                              Charge<span v-if="filing.multipleCounts">s</span>
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p>
                          2. The underlying conduct of
                          <span v-if="filing.multipleCounts"
                            >these offenses</span
                          ><span v-else>this offense</span> is no longer
                          prohibited by law or designated as a criminal offense.
                        </p>
                        <p>
                          3. Expunging all record of this conviction serves the
                          interests of justice.
                        </p>
                      </div>

                      <!--Petiton To Seal Conviction Minor-->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'SC' || filing.type == 'StipSC'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{
                          dateFormatSimple(petitioner.dob)}}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                          </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to seal the record of
                          the above-captioned conviction
                          <span v-if="filing.multipleCounts">s</span> pursuant
                          to <span v-if="2==2">33 V.S.A. &sect; 5119(g)</span><span v-else>13 V.S.A. 7602</span>.
                        </p>
                        <p>
                          1. Petitioner was convicted of the following
                          crime<span v-if="filing.multipleCounts">s</span>:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">Conviction Date</th>
                            <th valign="middle" colspan="2" scope="col">
                              Offense Description
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p>
                          2. Petitioner was under 25 when the crime<span
                            v-if="filing.multipleCounts"
                            >s were</span
                          ><span v-else> was</span> committed.
                        </p>

                        <p>
                          3. Petitioner was not later convicted of a listed
                          crime, pursuant to 13 V.S.A. &sect; 5301(7), within
                          the last 10 years, nor is petitioner currently being
                          charged of such an offense.
                        </p>
                        <p>
                          4. Petitioner believes the court will find that they
                          have been rehabilitated, as evidenced by the
                          following:
                        </p>
                      </div>


                      <!--Petiton To Seal Conviction ADULT-->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'SCAdult' || filing.type == 'StipSCAdult'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{
                          dateFormatSimple(petitioner.dob)}}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                          </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to seal the record of
                          the above-captioned conviction
                          <span v-if="filing.multipleCounts">s</span> pursuant
                          to 13 V.S.A. &sect; 7602.
                        </p>
                        <p>
                          1. Petitioner was convicted of the following
                          crime<span v-if="filing.multipleCounts">s</span>:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">Conviction Date</th>
                            <th valign="middle" colspan="2" scope="col">
                              Offense Description
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p>
                          2. The qualifying crime<span v-if="filing.multipleCounts">s were</span><span v-else> was</span> committed after the Petition reached the age of 19.
                        </p>

                        <p>
                          3. All restitution ordered here has been paid in full.
                        </p>
                        <p>
                          4. Sealing this record serves the interests of
                          justice, as
                        </p>
                      </div>

                      <!-- (Stipulated) Petiton To Seal DUI Conviction -->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'SDui' || filing.type == 'StipSDui'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{petitioner.dob
                          }}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                        </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to seal the record of
                          the above-captioned conviction
                          <span v-if="filing.multipleCounts">s</span> pursuant
                          to 13 V.S.A. &sect; 7602(a)(1)(C).
                        </p>
                        <p>
                          1. Petitioner was convicted of the following
                          crime<span v-if="filing.multipleCounts">s</span>:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">Conviction Date</th>
                            <th valign="middle" colspan="2" scope="col">
                              Offense Description
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p>
                          2. At least 10 years have elapsed since the date
                          petitioner successfully completed their sentence.
                        </p>

                        <p>
                          3. This conviction is the only violation of 23 V.S.A.
                          &sect; 1201 that petitioner has on their record, and
                          petitioner has not been convicted of any new crime
                          since they were convicted of this offense.
                        </p>
                        <p>
                          4. All restitution ordered here has been paid in full.
                        </p>
                        <p>
                          5. Sealing this record serves the interests of
                          justice, as
                        </p>
                      </div>

                      <!-- (Stipulated) Petiton To Seal Negligent Operation Conviction -->
                      <div
                        class="filing-body"
                        v-if="filing.type == 'NegOp' || filing.type == 'StipNegOp'"
                      >
                        <p class="indent">
                          NOW COMES {{petitioner.name}} (DOB: {{petitioner.dob
                          }}),
                          <span v-if="proSeFromRole(settings.role)"
                            >appearing <span class="italic">pro se</span>
                        </span>
                          <span v-else>
                            by and through counsel,
                            <span>{{settings['attorney']}}</span> </span
                          >, and hereby moves the Court to seal the record of
                          the above-captioned conviction
                          <span v-if="filing.multipleCounts">s</span> pursuant
                          to 13 V.S.A. &sect; 7602(a)(1)(C).
                        </p>
                        <p>
                          1. Petitioner was convicted of the following
                          crime<span v-if="filing.multipleCounts">s</span>:
                        </p>
                        <table class="count-table">
                          <thead class="count-table__header">
                            <th valign="middle" scope="col">Conviction Date</th>
                            <th valign="middle" colspan="2" scope="col">
                              Offense Description
                            </th>
                          </thead>
                          <tbody class="count-table__body">
                            <tr
                              class="count-item"
                              v-for="count in filing.counts"
                            >
                              <td class="count-item__date">
                                <span class="no-visible"
                                  >{{
                                  dateFormatSimple(count.dispositionDate)}}</span
                                >
                                <input
                                  type="date"
                                  class="no-print"
                                  v-model="count.dispositionDate"
                                  :max="maxDate"
                                />
                              </td>
                              <td class="count-item__description">
                                <span class="no-visible"
                                  >{{count.description}} ({{count.docketNum}}
                                  {{toCountyCode(count.county)}})</span
                                >
                                <textarea
                                  rows="1"
                                  class="no-print count-item__textarea"
                                  v-model="count.description"
                                ></textarea>
                              </td>
                              <td class="no-print">
                                {{count.docketNum}} {{
                                toCountyCode(count.county)}}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p>
                          2. At least 10 years have elapsed since the date
                          petitioner successfully completed their sentence.
                        </p>

                        <p>
                          3. This conviction is the only violation of 23 V.S.A.
                          &sect; 1201 that petitioner has on their record, and
                          petitioner has not been convicted of any new crime
                          since they were convicted of this offense.
                        </p>
                        <p>
                          4. All restitution ordered here has been paid in full.
                        </p>
                        <p>
                          5. Sealing this record serves the interests of
                          justice, as
                        </p>
                      </div>

                      <!-- End Unique Portion of Filings -->

                      <div
                        v-if="filing.type != 'NoA' && filing.type != 'feeWaiver'"
                      >
                        <div class="filing-body__response">
                          <p
                            class="no-visible"
                            v-html="nl2br(responses[filing.id])"
                          ></p>
                          <textarea
                            class="no-print"
                            v-model="responses[filing.id]"
                            placeholder="Type here..."
                          ></textarea>
                        </div>
                      </div>

                      <!-- Begin generic footer -->
                      <div
                        v-if="filing.type != 'NoA' && filing.type != 'feeWaiverAffidavit'"
                      >
                        <div class="filing-closing">
                          <p class="filing-closing__salutation">
                            Respectfully requested,
                          </p>
                          <div class="filing-closing__signature-area">
                            <div class="filing-closing__signature-box">
                              <div v-if="proSeFromRole(settings.role)">
                                <p class="filing-closing__name">
                                  {{petitioner.name}}, Petitioner
                                </p>
                                <p
                                  class="filing-closing__petitioner-address"
                                  v-html="petitioner.address"
                                ></p>
                              </div>
                              <div v-else>
                                <p class="filing-closing__name">
                                  <span>{{settings['attorney']}}</span>
                                </p>

                                <p
                                  class="filing-closing__petitioner-address"
                                  v-html="nl2br(settings['attorneyAddress'])"
                                ></p>
                              </div>
                            </div>
                            <div class="filing-closing__date-box">
                              <p>Date</p>
                            </div>
                          </div>

                          <filing-footer
                            v-bind:type="filing.type"
                            v-bind:stipulated="filing.isStipulated"
                          ></filing-footer>
                        </div>
                      </div>
                        <div class="filing-closing" v-if="filing.type == 'NoA'">
                          <filing-dated-city
                            v-if="!proSeFromRole(settings.role)"
                          ></filing-dated-city>
                          <div
                            class="filing-closing__signature-area filing-closing--align-right"
                          >
                            <div class="filing-closing__signature-box">
                              <div v-if="proSeFromRole(settings.role)">
                                <p class="filing-closing__name">
                                  {{petitioner.name}}, Petitioner
                                </p>
                                <div class="filing-closing__contact-box">
                                  <p
                                    class="filing-closing__contact-box-title bold"
                                  >
                                    Petitioner's Address &amp; Phone Number:
                                  </p>
                                  <p
                                    class="filing-closing__petitioner-address"
                                    v-html="petitioner.address"
                                  ></p>
                                  <p class="filing-closing__phone">
                                    Phone:
                                    <span class="no-visible"
                                      >{{responses['phone']}}</span
                                    >
                                    <input
                                      class="no-print"
                                      v-model="responses['phone']"
                                      placeholder="Petitioner Phone Number"
                                    />
                                  </p>
                                </div>
                              </div>
                              <div v-else>
                                <p class="filing-closing__name">
                                  <span>{{settings['attorney']}}</span>
                                </p>
                                <div class="filing-closing__contact-box">
                                  <p
                                    class="filing-closing__contact-box-title bold"
                                  >
                                    Attorney's Address &amp; Phone Number:
                                  </p>
                                  <p
                                    class="filing-closing__petitioner-address"
                                    v-html="nl2br(settings['attorney']+'\n'+settings['attorneyAddress']+'\n'+settings['attorneyPhone'])"
                                  ></p>
                                </div>
                              </div>
                            </div>
                            <div
                              v-if="proSeFromRole(settings.role)"
                              class="filing-closing__date-area-prose"
                            >
                              Date
                            </div>
                          </div>
                        </div>
                      <div v-if="filing.type == 'feeWaiverAffidavit'">
                        <div class="filing-closing">
                          I declare that the above statement is true and
                          accurate to the best of my knowledge and belief. I
                          understand that if the above statement is false, I may
                          be subject to sanctions by the Court for contempt.
                          <filing-dated-city
                            v-if="!proSeFromRole(settings.role)"
                          ></filing-dated-city>
                          <div
                            class="filing-closing__signature-area filing-closing--align-right"
                          >
                            <div class="filing-closing__signature-box">
                                <p class="filing-closing__name">
                                  {{petitioner.name}}, Petitioner
                                </p>
                                <p
                                  class="filing-closing__petitioner-address"
                                  v-html="petitioner.address"
                                ></p>
                            </div>
                            <div
                              v-if="proSeFromRole(settings.role)"
                              class="filing-closing__date-area-prose"
                            >
                              Date
                            </div>
                          </div>
                        </div>
                        <div class="filing-closing" v-if="settings.affidavitRequired">
                            <div class="notary-block">
                              <br />
                              <p>STATE OF VERMONT</p>
                              <p>___________________ COUNTY, ss.</p>
                              <br />
                              <p>
                                Sworn to and subscribed before me this ______
                                day of ________________, _______ by
                                {{petitioner.name}}, who acknowledged the
                                execution of the foregoing AFFIDAVIT IN SUPPORT
                                OF MOTION TO WAIVE LEGAL FINANCIAL OBLIGATIONS
                                to be their own free act and deed.
                              </p>
                              <br /><br />
                              <p>_____________________________</p>
                              <p>Notary Public</p>
                              <p>
                                My Commission Expires {{getNextNotaryDate()}}.
                              </p>
                            </div>
                        </div>
                      </div>
                      <!-- End generic footer -->
                    </div>
                  </article>

                  <article class="spacer-page no-visible"></article>
                </section>
              </td>
            </tr>
          </tbody>
          <!-- <tfoot class="footer-space">
            <tr>
              <td>
                <p class="footer-space__vertical-spacer">&nbsp;</p>
              </td>
            </tr>
          </tfoot> -->
        </table>
        <!-- End petition wrapper -->

        <div v-if="settings.forVla" class="footer">
          <p class="footer__company">Vermont Legal Aid, Inc.</p>
          <p class="footer__phone">(800) 889-2047</p>
        </div>
        <div v-else class="footer">
          <p class="footer__company">{{settings['footer1']}}</p>
          <p class="footer__phone">{{settings['footer2']}}</p>
        </div>
      </div>

      <!-- else show default "no filings" display -->
      <div v-else>
        <div class="no-filings">
          <p>
            There are no filings to prepare.
            <span v-if="numCountsNoAction > 0"
              >Please open the ExpungeVT extension window and select a filing
              type for at least one of the loaded counts.</span
            ><span v-else
              >Please navigate to
              <a href="https://secure.vermont.gov/vtcdas/user"
                >VT Courts Online</a
              >
              and open the Expunge VT extension to begin a new session.</span
            >
          </p>
          <p class="alert alert-warning">
            You may want to visit the add/edit counts section to add counts or
            check for errors.
            <button
              v-on:click="addAndOpenManagePage"
              class="edit-counts btn btn-primary"
            >
              Add/Edit <i class="fas fa-edit"></i>
            </button>
          </p>
        </div>
      </div>
</template>
