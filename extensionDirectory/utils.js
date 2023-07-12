import Gumshoe from 'gumshoejs'
import SmoothScroll from 'smooth-scroll';

export function autoExpand(field) {
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
    if (self.installType == 'development') {
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
  document.addEventListener("DOMContentLoaded", () => {
    initScrollDetection();
    setInitialExpandForTextAreas();
    initTextAreaAutoExpand();
    initSmoothScroll();
  });
}

export function initScrollDetection() {
  // initates the scrollspy for the filing-nav module.
  // see: https://www.npmjs.com/package/gumshoejs#nested-navigation
  var spy = new Gumshoe('#filing-nav a', {
    nested: true,
    nestedClass: 'active-parent',
    offset: 200, // how far from the top of the page to activate a content area
    reflow: true, // will update when the navigation chages (eg, user adds/changes a petition, or consolidates petitions/NOAs)
  });
}

export function initSmoothScroll() {
  var scroll = new SmoothScroll('a[href*="#"]', {
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

export function setInitialExpandForTextAreas() {
  //sets the default size for all text areas based on their content.
  //call this after vue has initialized and displayed
  var textAreas = document.getElementsByTagName('textarea');
  for (var index in textAreas) {
    var textArea = textAreas[index];
    if (textArea === undefined) return;
    autoExpand(textArea);
  }
}

export function toCountyCode(value) {
  if (!value) return '';
  return countyCodeFromCounty(value);
}