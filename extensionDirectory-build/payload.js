(() => {
  // payload.js
  docketData = {
    domain: window.location.hostname,
    url: window.location.href,
    rawDocket: null,
    savedDocket: false
  };
  switch (docketData.domain) {
    case "publicportal.courts.vt.gov":
    case "htmlpreview.github.io": {
      docketData.rawDocket = document.getElementById("roa-content").innerHTML;
      break;
    }
  }
  if (docketData.url.startsWith("file")) {
    let title = document.title;
    docketData.rawDocket = document.getElementById("roa-content").innerHTML;
    if (title === "ExpungeVT Case Record") {
      docketData.domain = "expungeVtRecord";
    } else {
      answer = window.confirm("This does not look like a case file. Are you sure you want to proceed?");
      if (answer) {
        docketData.domain = "localhost";
      } else {
        docketData.rawDocket = null;
      }
    }
  }
  var answer;
  if (docketData.rawDocket !== null) {
    chrome.runtime.sendMessage(docketData);
  } else {
    alert("Uh oh. ExpungeVT doesn't support this site. If you are trying to load a case, open the file from your computer so it opens in Chrome and follow the instructions from there. You may need to right click or ctrl+click (on Mac) on the file to open the file in Chrome.");
  }
})();
