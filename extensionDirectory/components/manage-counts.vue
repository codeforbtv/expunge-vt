filingNav
<script>
import $ from 'jquery';
import dayjs from 'dayjs';
import Gumshoe from 'gumshoejs';
import SmoothScroll from 'smooth-scroll';
import 'bootstrap';
import 'bootstrap4-toggle';
import { toRaw } from 'vue';
import { storeToRefs } from 'pinia';

import {
  confirmDeleteCount,
  countyCodeFromCounty,
  dateFormatSimple,
  deleteCount,
  detectChangesInChromeStorage,
  devLog,
  getError,
  getNextNotaryDate,
  handlePrintMacro,
  initAfterVue,
  loadAll,
  maxDate,
  nl2br,
  saveCounts,
  saveResponses,
  saveSettings,
  sinceNow,
  stringAgeInYearsAtDate,
  toCountyCode,
} from '../utils';

import { useDataStore } from '../store.mjs';

export default {
  // el: '#filing-app',
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
          'adminConfig data has been set in manage counts at line: ' +
            getError()
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
    //This is to make sure dynamically created table are unique across tab in order to avoid errors
    this.uniqueId = this._uid;
  },
  methods: {
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
    newCount: function (event) {
      this.saved.counts.push({ description: 'New', filingType: '' });
    },
    confirmDeleteCount: function (event, countId) {
      confirmDeleteCount(this, event, countId);
    },
    deleteCount: function (countId) {
      deleteCount(this, countId);
    },
    nl2br: nl2br,
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
    getNextNotaryDate: getNextNotaryDate,
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
    todayDate: function () {
      date = dayjs().format('MMMM D[, ]YYYY');
      return date;
    },
  },
};
</script>

<template>
  <div>
    <div class="header-bar-wrapper no-print">
      <div class="header-bar">
        <h1 v-if="petitioner.name">Counts for {{ petitioner.name }}</h1>
        <div class="header-bar__controls">
          <button v-on:click="newCount" class="btn btn-primary">
            Add Count <i class="fas fa-plus-circle"></i>
          </button>

          <a href="filings.html" class="btn btn-success">
            View Petitions <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    </div>

    <div style="margin: 40px;">
      <h2>Petitioner Information</h2>

      <div>
        <label>
          Name
          <input class="form-control" v-model="saved.defName" />
        </label>
        <label class="pet-label">
          Date of Birth
          <input class="form-control" type="date" v-model="saved.defDOB" />
        </label>
      </div>

      <div>
        <label class="pet-label">
          Address
          <textarea
            class="form-control"
            v-model="saved.defAddress"
            placeholder="e.g. 123 Main Street"
          ></textarea>
        </label>
      </div>
    </div>

    <section
      class="edit-count"
      v-for="(group, index) in saved.counts"
      v-bind:id="group"
      style="margin: 40px;"
    >
      <h3 class="edit-count__title">
        Count {{ index + 1 }}:
        <span v-if="group.description">{{ group.description }}</span>
      </h3>
      <p>
        <b>{{ group.docketNum }} {{ toCountyCode(group.county) }}</b>
      </p>

      <form>
        <div>
          <label style="min-width: 70%;">
            Count Description<b>*</b>
            <input
              required=""
              class="form-control"
              v-model="group.description"
              placeholder="Description"
            />
          </label>

          <div>
            <label>
              <span>Docket Number<b>*</b></span>
              <input
                required=""
                class="form-control"
                v-model="group.docketNum"
                placeholder="Docket Num"
              />
            </label>
            <label>
              <span>County<b>*</b></span>
              <select required="" class="form-control" v-model="group.county">
                <option>Addison</option>
                <option>Bennington</option>
                <option>Caledonia</option>
                <option>Chittenden</option>
                <option>Essex</option>
                <option>Franklin</option>
                <option>Grand Isle</option>
                <option>Lamoille</option>
                <option>Orange</option>
                <option>Orleans</option>
                <option>Rutland</option>
                <option>Washington</option>
                <option>Windham</option>
                <option>Windsor</option>
              </select>
            </label>

            <label>
              <span>Disposition Date<b>*</b></span>
              <input
                required=""
                class="form-control"
                type="date"
                v-model="group.dispositionDate"
                placeholder="Disposition Date"
                :max="maxDate"
            /></label>
          </div>

          <label>
            Filing for this count<b>*</b>
            <select
              class="form-control petitionSelect selectpicker"
              v-model="group.filingType"
            >
              <option value="X">No Filing</option>
              <option value="ExC">Expunge Conviction</option>
              <option value="ExNC">Expunge Non-Conviction</option>
              <option value="ExNCrim">Expunge Non-Criminal</option>
              <option value="SC">Seal Conviction Under 25</option>
              <option value="SCAdult">Seal Conviction Adult</option>
              <option value="SDui">Seal DUI</option>
              <option value="NegOp">Seal Neg Op</option>
              <option value="StipExC">(Stipulated) Expunge Conviction</option>
              <option value="StipExNC"
                >(Stipulated) Expunge Non-Conviction</option
              >
              <option value="StipExNCrim"
                >(Stipulated) Expunge Non-Criminal</option
              >
              <option value="StipSC"
                >(Stipulated) Seal Conviction Under 25</option
              >
              <option value="StipSCAdult"
                >(Stipulated) Seal Conviction Adult</option
              >
              <option value="StipSDui">(Stipulated) Seal DUI</option>
              <option value="StipNegOp">(Stipulated) Seal Neg Op</option>
            </select>
          </label>
        </div>

        <hr />

        <div>
          <label>
            <p
              v-if="
                !checkDocketMatch(
                  group.docketSheetNum,
                  group.docketNum,
                  group.county
                ) &&
                (group.docketNum || group.county)
              "
              class="alert alert-warning"
            >
              <b
                >WARNING - Unexpected format: the petition page may not render
                correctly.</b
              ><br />
              Expecting "docket <i>sheet</i> number" below to match docket
              number above followed by the county code:
              <b
                ><span
                  >{{ group.docketNum }}
                  <span v-if="group.county">{{
                    toCountyCode(group.county)
                  }}</span
                  ><span v-else>[No County Entered]</span></span
                ></b
              >
            </p>
            <span>Original Docket Sheet Number</span>
            <input
              class="form-control"
              v-model="group.docketSheetNum"
              placeholder="Docket Num"
            />
          </label>

          <div>
            <label>
              <span>Alleged Offense Date</span>
              <input
                class="form-control"
                type="date"
                v-model="group.allegedOffenseDate"
                placeholder="Offense Date"
                :max="maxDate"
              />
            </label>

            <label>
              <span>Arrest Citation Date</span>
              <input
                class="form-control"
                type="date"
                v-model="group.arrestCitationDate"
                placeholder="Arrest Citation Date"
                :max="maxDate"
              />
            </label>
          </div>

          <div>
            <label width="400px"
              >Offense Disposition
              <input
                class="form-control"
                v-model="group.offenseDisposition"
                placeholder="e.g. Dismissed By State"
              />
            </label>

            <label class="checkbox-inline">
              <input v-model="group.isDismissed" type="checkbox" /><span>
                Is Dismissed</span
              >
            </label>
          </div>
        </div>

        <hr />

        <div>
          <label for="vsc-title">
            <span>Statue Title</span>
            <input
              id="vsc-title"
              class="form-control"
              v-model="group.titleNum"
              placeholder="Title"
            />
          </label>

          <label for="vsc-section">
            <span>Statute Section</span
            ><input
              id="vsc-section"
              class="form-control"
              v-model="group.sectionNum"
              placeholder="Section"
            />
          </label>

          <label>
            <span>Offense Class</span>
            <select class="form-control" v-model="group.offenseClass">
              <option value="mis">Misdemeanor</option>
              <option value="fel">Felony</option>
            </select>
          </label>
        </div>

        <p v-if="group.titleNum || group.sectionNum || group.offenseClass">
          <b
            >{{ group.titleNum || '-' }} V.S.A. &sect;
            {{ group.sectionNum || '-' }} ({{ group.offenseClass || '-' }})</b
          >
        </p>

        <div />

        <div>
          <button
            v-on:click="confirmDeleteCount($event, group.uid)"
            class="btn btn-danger"
          >
            Delete Count
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
