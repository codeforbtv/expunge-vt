// send the docket content as a chrome message back to the popup script. The data will be parsed there.
docketBody = document.getElementsByTagName("pre")[0].innerHTML
chrome.runtime.sendMessage(docketBody);
