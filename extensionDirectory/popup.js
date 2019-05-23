let createPetition = document.getElementById('create-petition');
let resetDocket = document.getElementById('reset-docket-info');
let newElement = `'<span style="color:red">TEST</span>'`;
let loadedMessage;
let docketInfo = document.getElementById('docketInfo');

createPetition.onclick = function (element) {
    chrome.tabs.create({
        url: chrome.extension.getURL('formMenu.html')
    })
};

if (typeof loadedMessage !== 'undefined') {
docketInfo.addEventListener("load", setPopUpData(loadedMessage))
}

resetDocket.onclick = function (element) {

    if (window.confirm("Are you sure?")) {
        injectPayload();
    }
    chrome.storage.local.clear();

    function injectPayload() {
        // Inject the payload.js script into the current tab after the popout has loaded
        chrome.tabs.executeScript(null, {
            file: 'payload.js'
        });
    }
};

// Listen to messages from the payload.js script and write to popout.html
chrome.runtime.onMessage.addListener(function (message) {

    loadedMessage = message
    setPopUpData(message)

});

function setPopUpData(counts) {

    //defendant info
    document.getElementById('pagetitle').innerHTML = counts[0]["defName"];
    document.getElementById('defendantDOB').innerHTML = counts[0]["defDOB"];

    //count info
    document.getElementById('docket').innerHTML = counts[0]["docket"]  + " " + counts[0]["countyCode"] + " - Count #" + counts[0]["countNum"];
    document.getElementById('offenseStatute').innerHTML = counts[0]["offenseTitle"] + " V.S.A. &sect " + counts[0]["offenseSection"] + " (" + counts[0]["offenseDesc"] + ")";
    document.getElementById('offenseClass').innerHTML = counts[0]["fmo"];
    document.getElementById('offenseStatus').innerHTML = counts[0]["offenseStatus"];
    document.getElementById('date').innerHTML = counts[0]["date"];

    
}
