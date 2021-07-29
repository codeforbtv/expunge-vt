/* The purpose of this file is
 *  - to be the first step in parsing dockets
 *  - to determine the site and grab the correct content
 *  - to alert user when the extension is used on an unsupported site
 */

docketData = {
  domain: window.location.hostname,
  url: window.location.href,
  rawDocket: null,
  savedDocket: false,
};

// parse data from the current site
switch (docketData.domain) {
  // new VT Judiciary Public Portal (aka Odyssey, aka Tyler Technologies)
  case 'publicportal.courts.vt.gov':

  // demo site used to test extension (see readme or codeforbtv.github.io/expunge-vt/)
  case 'htmlpreview.github.io': {
    docketData.rawDocket = document.getElementById('roa-content').innerHTML;
    break;
  }
}

// If an expected site was not found, maybe it is being run on a local file?
if (docketData.url.startsWith('file')) {
  let title = document.title;
  docketData.rawDocket = document.getElementById('roa-content').innerHTML;
  if (title === 'ExpungeVT Case Record') {
    docketData.domain = 'expungeVtRecord'
  } else {
    docketData.domain = 'localhost'
  }
}

// Send message or alert user
if (docketData.rawDocket !== null) {
  // pass relevant content through from current site as a chrome message back to
  // the popup script. The data will be parsed there.
  chrome.runtime.sendMessage(docketData);
} else {
  /* TODO: we could more cleanly handle this case where a user tries to parse a site we're not expecting
   *  - a) We could bundle some message in the docketData object and handle downstream
   *  - b) We could make the popup self-aware of the active page and disallow parsing on unexpected sites
   */
  alert("Uh oh. ExpungeVT doesn't support this site.");
}

// docketData.domain = 'localhost';
// alert('Hello');
// if (1 == 2) {
//   docketData.rawDocket = document.getElementById('roa-content').innerHTML;
// } else {
//   let decryptedSavedFIle = JSON.parse(
//     Base64.decode(document.getElementById('roa-content').innerHTML)
//   );
//   this.saved = decryptedSavedFIle;
// }
