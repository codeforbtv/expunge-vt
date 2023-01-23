import './filings.css';
import "../../../node_modules/bootstrap/dist/css/bootstrap.min.css"
import "../../../node_modules/bootstrap4-toggle/css/bootstrap4-toggle.min.css"
import "../../../node_modules/@fortawesome/fontawesome-free/css/all.css"

import { createApp } from 'vue';
// import $ from 'jquery';
// import moment from 'moment';

import "../../../node_modules/jquery/dist/jquery.js"
import "../../../node_modules/bootstrap/dist/js/bootstrap.min.js"
import "../../../node_modules/bootstrap4-toggle/js/bootstrap4-toggle.min.js"
import "../../../node_modules/vue/dist/vue.global.js"
import "../../../node_modules/smooth-scroll/dist/smooth-scroll.polyfills.min.js"
import "../../../node_modules/gumshoejs/dist/gumshoe.polyfills.min.js"
import "../../../node_modules/moment/min/moment.min.js"

import Gumshoe from 'gumshoejs'
import SmoothScroll from 'smooth-scroll';

import PopupApp from '../../components/popup.vue';

import '../../scripts/saveFile.js'


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
 * @todo find a way to make this reusable, then delete the duplicate fn() in popup.js
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
  // initiates the scrollspy for the filing-nav module.
  // see: https://www.npmjs.com/package/gumshoejs#nested-navigation
  var spy = new Gumshoe('#filing-nav a', {
    nested: true,
    nestedClass: 'active-parent',
    offset: 200, // how far from the top of the page to activate a content area
    reflow: true, // will update when the navigation changes (eg, user adds/changes a petition, or consolidates petitions/NOAs)
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
  var counties = {
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
  var countyCodes = {
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
var app = createApp(PopupApp).mount('#filing-app');

function getError() {
  return 'TODO: getError should work :('; // TODO: The code below explodes, so just no-op for now
  // return new Error().stack
  //   .split('\n')[1]
  //   .split('filings.js')[1]
  //   .replace(')', '')
}
