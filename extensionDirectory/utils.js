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

export function printListener() {
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

export function initAfterVue() {
  //sets intital height of all text areas to show all text.
  devLog(document.getElementsByTagName('body')[0].id);
  if (document.getElementsByTagName('body')[0].id === 'filing-page') {
    initScrollDetection();
    setInitialExpandForTextAreas();
    initTextAreaAutoExpand();
    initSmoothScroll();
  }
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