// send the docket content as a chrome message back to the popup script. The data will be parsed there.

let currentSite = window.location.hostname;
console.log(currentSite);
// conditionally parsing docket info from current site
if (currentSite === 'secure.vermont.gov') {
  // TODO:  verify current site is VTCO
  console.log('... parsing VTCO');
  docketBody = document.getElementsByTagName('pre')[0].innerHTML;
  chrome.runtime.sendMessage(docketBody);
} else if (currentSite === 'publicportal.courts.vt.gov') {
  // TODO: verify current site is Odyssey
  console.log('... parsing Odyssey');
} else {
  // TODO: don't forget about codeforbtv.org and setting a default 'else'
}
