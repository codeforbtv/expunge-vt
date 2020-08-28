let docketData = {
  domain: window.location.hostname,
  rawDocket: null,
};

// select data from the current site
switch (docketData.domain) {
  case 'secure.vermont.gov': {
    docketData.rawDocket = document.getElementsByTagName('pre')[0].innerHTML;
    break;
  }
  case 'publicportal.courts.vt.gov': {
    docketData.rawDocket = document.getElementById('roa-content').innerHTML;
    break;
  }
  default: {
    // TODO: don't forget about codeforbtv.org and setting a default 'else'
  }
}

// pass relevant content through from current site as a chrome message back to
// the popup script. The data will be parsed there.
chrome.runtime.sendMessage(docketData);
