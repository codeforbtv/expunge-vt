<script>
import $ from 'jquery';
import { toRaw } from 'vue';
import { storeToRefs } from 'pinia';

import pillsRow from './pills-row.vue';

import {
  openPetitionsPage,
  confirmClearData,
  dateFormatSimple,
  detectChangesInChromeStorage,
  devLog,
  getError,
  loadAll,
  maxDate,
  nl2br,
  openManagePage,
  saveCounts,
  saveResponses,
  saveSettings,
  sinceNow,
  stringAgeInYearsAtDate,
  toCountyCode,
  todayDate,
} from '../utils';

import { useDataStore } from '../store.mjs';

// Vue.config.devtools = true;

export default {
  // el: '#filing-app',
  components: {
    pillsRow,
  },
  data() {return {
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
        this.popupHeadline = data.expungeHeadline;
        this.roleCoverLetterText = data['roleText'];
        this.coverLetterContent = data['letter'];
        this.stipDef = data['stipDefinition'];
      }.bind(this)
    );
  },
  mounted() {
    this.loadAll();
    detectChangesInChromeStorage(this, true);

    //This is to make sure dynamically created table are unique across tab in order to avoid errors
    this.uniqueId = this._uid;
  },
  methods: {
    addAndOpenManagePage: function () {
      if (this.saved.counts.length == 0) {
        this.newCount();
        this.saved['defName'] = 'New Petitioner';
      }
      openManagePage();
    },
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
    confirmClearData: function () {
      confirmClearData(this);
    },
    newCount: function (event) {
      this.saved.counts.push({ description: 'New', filingType: '' });
    },
    nl2br: nl2br,
    openManagePage: openManagePage,
    openPetitionsPage: openPetitionsPage,
    saveSettings: function () {
      saveSettings(this.settings);
    },
    saveResponses: function () {
      saveResponses(this.responses);
    },
    saveCounts: function () {
      saveCounts(toRaw(this.saved));
    },
    loadAll: function (callback) {
      loadAll(this, callback);
    },
    loadCaseFile: async function () {
      let query = { active: true, currentWindow: true };
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
          chrome.tabs
            .query({ active: true, currentWindow: true })
            .then(([tab]) => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['payload.js'],
              });
            });
        } else {
          let goToSettings = confirm(
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
    stringAgeInYearsAtDate: stringAgeInYearsAtDate,
    sinceNow: sinceNow,
    dateFormatSimple: dateFormatSimple,
    toCountyCode,
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
    maxDate: maxDate,
    todayDate: todayDate,
  },
};
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
      <p class="popup-edition">ExpungeVT 5.0 - A New Manifest</p>
    </div>
    <div class="inset text-center button-div">
      <button
        v-on:click="addDocketCounts"
        class="add-docket-info btn btn-primary"
        :disabled="!settings.termsChecked"
      >
        Add From Page <i class="fas fa-plus-circle"></i>
      </button>
      <button
        v-on:click="loadCaseFile"
        class="add-docket-info btn btn-primary"
        :disabled="!settings.termsChecked"
      >
        Load Case File<br /><i class="fas fa-file"></i>
      </button>
      <button
        v-on:click="addAndOpenManagePage"
        class="edit-counts btn btn-primary"
        :disabled="!settings.termsChecked"
      >
        Add/Edit <i class="fas fa-edit"></i>
      </button>
    </div>
    <a class="title-page__link">
      <div class="checkbox-container">
        <label for="checkbox">
          <input
            type="checkbox"
            id="checkbox"
            v-model="settings.termsChecked"
            class="checkbox-input"
          />
          <span class="checkmark"></span>
        </label>
        <span
          >By checking this box to enable this app, you agree to all
          <a target="_blank" href="disclaimer.html"
            >Terms &amp; Conditions.<i class="fas fa-external-link-alt"></i></a
        ></span>
      </div>
      <div
        v-if="popupHeadline != ''"
        id="introText"
        v-html="popupHeadline"
      ></div>
      <div v-else></div>
    </a>
    <br />
    <a
      id="vtCourtsOnlineA"
      class="title-page__link"
      target="_blank"
      href="https://publicportal.courts.vt.gov/Portal"
    >
      <p id="vtCourtsOnline">
        <b
          >Go to Vermont Judiciary Public Portal
          <i class="fas fa-external-link-alt"></i
        ></b>
      </p>
    </a>
    <div class="donate-box">
      <a
        class="edit-counts btn btn-success donate title-page__link"
        href="https://www.paypal.com/paypalme/c4btv"
        target="_blank"
        >Donate to<br />Code for BTV!&nbsp;&nbsp;&nbsp;<i
          class="fas fa-hand-holding-usd"
        ></i
      ></a>
      <a
        class="edit-counts btn btn-primary donate title-page__link"
        href="https://opencollective.com/act-fund"
        target="_blank"
      >
        Donate to the Alliance of Civic Technologists!&nbsp;&nbsp;&nbsp;<i
          class="fas fa-hand-holding-usd"
        ></i>
      </a>
    </div>
    <a href="https://www.civictechnologists.org/" target="_blank">
      <div class="act-image-wrap">
        <img src="../images/ACT_logo_color.png" alt="" class="act-image" />
      </div>
    </a>
    <p class="popup-edition-sub">Code for BTV is supported in part by ACT.</p>
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
            id="petitionerName"
            class="form-control form-control-sm"
            v-model="saved.defName"
          />
        </div>
        <div class="pet-item">
          <p class="pet-label">DOB:</p>
          <input
            class="form-control form-control-sm"
            type="date"
            id="petitionerDOB"
            v-model="saved.defDOB"
            :max="maxDate"
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
            id="petitionerEmail"
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
        <img src="/images/code4BTV-logo-300-300.png" alt="Home" class="logos" />
        <img src="/images/VLA_logo-200-97px.png" alt="Home" class="logos" />
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
          Closing all petition windows (without closing browser) may help stop
          unexpected behavior. Save your file in the petitions screen before
          closing the browser, and try restarting the browser. If you are still
          experiencing issues, contact
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
      Counts ({{ saved.counts.length }})
    </p>
    <div id="countCards" class="count-cards inset text-center">
      <!-- begin card -->

      <div
        class="card"
        v-bind:id="count.uid"
        v-for="(count, index) in saved.counts"
        v-bind:key="index"
      >
        <div class="card-header">
          <div class="card-header__column">
            <div class="card-header__title-row">
              <div id="description-date" class="card-header__meta-data">
                <div class="card-header__description btn btn-link btn-sm">
                  <p v-if="count.docketNum">
                    <b>
                      <a v-bind:href="count.url" target="_blank">
                        {{ count.docketNum }}
                        {{ toCountyCode(count.county) }}</a
                      ></b
                    >
                  </p>
                  <p v-if="count.description">
                    <b>{{ count.description }}</b>
                  </p>
                </div>
                <p
                  class="card-header__disposition-date"
                  v-if="count.dispositionDate"
                >
                  Est. Disposition:
                  {{ dateFormatSimple(count.dispositionDate) }} ({{
                    sinceNow(count.dispositionDate)
                  }}
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
                  <option value="SC">Seal Conviction Under 25</option>
                  <option value="SCAdult">Seal Conviction Adult</option>
                  <option value="SDui">Seal DUI</option>
                  <option value="NegOp">Seal Neg Op</option>
                  <option value="StipExC">(Stip) Expunge Conviction</option>
                  <option value="StipExNC">
                    (Stip) Expunge Non-Conviction
                  </option>
                  <option value="StipExNCrim">
                    (Stip) Expunge Non-Criminal
                  </option>
                  <option value="StipSC">
                    (Stip) Seal Conviction Under 25
                  </option>
                  <option value="StipSCAdult">
                    (Stip) Seal Conviction Adult
                  </option>
                  <option value="StipSDui">(Stip) Seal DUI</option>
                  <option value="StipNegOp">(Stip) Seal Neg Op</option>
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
            <p>County:&nbsp;{{ count.county }}</p>

            <p v-if="count.titleNum || count.sectionNum">
              Statute:&nbsp;{{ count.titleNum }} V.S.A.
              <span
                v-html="'&nbsp;&sect; ' + count.sectionNum"
                v-if="count.sectionNum"
              ></span
              >&nbsp;({{ count.offenseClass }})
            </p>
            <p>
              Disposition:&nbsp;{{ count.offenseDisposition }}
              <span v-if="!count.offenseDisposition">Check Docket Sheet</span>
            </p>
            <div class="row text-left">
              <div class="col-4">
                Offense Date:<br />
                <span v-if="!count.allegedOffenseDate">&nbsp;Not Entered</span>
                <span v-else-if="saved.defDOB.length === 0"
                >{{ dateFormatSimple(count.allegedOffenseDate) }}</span>
                <span v-else
                  >{{ dateFormatSimple(count.allegedOffenseDate) }} ({{
                    stringAgeInYearsAtDate(
                      count.allegedOffenseDate,
                      saved.defDOB
                    )
                  }})</span
                >
              </div>
              <div class="col-4">
                Arrest/Citation Date:<br />
                <span v-if="!count.arrestCitationDate">&nbsp;Not Entered</span>
                <span v-else-if="saved.defDOB.length === 0"
                >{{ dateFormatSimple(count.arrestCitationDate) }}</span>
                <span v-else
                  >{{ dateFormatSimple(count.arrestCitationDate) }} ({{
                    stringAgeInYearsAtDate(
                      count.arrestCitationDate,
                      saved.defDOB
                    )
                  }})</span
                >
              </div>
              <div class="col-4">
                Disposition Date:<br />
                <span v-if="!count.dispositionDate">&nbsp;Pending</span>
                <span v-else-if="saved.defDOB.length === 0"
                >{{ dateFormatSimple(count.dispositionDate) }}</span>
                <span v-else
                  >{{ dateFormatSimple(count.dispositionDate) }} ({{
                    stringAgeInYearsAtDate(count.dispositionDate, saved.defDOB)
                  }})</span
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
