let createPetition = document.getElementById('create-petition');




let newElement = `'<span style="color:red">TEST</span>'`

createPetition.onclick = function (element) {
    chrome.tabs.create({
        url: chrome.extension.getURL('options.html#window')
    })
};


// Inject the payload.js script into the current tab after the popout has loaded
window.addEventListener('load', function (evt) {
    chrome.extension.getBackgroundPage().chrome.tabs.executeScript(null, {
        file: 'payload.js'
    });;
});

// Listen to messages from the payload.js script and write to popout.html
chrome.runtime.onMessage.addListener(function (message) {

    document.getElementById('pagetitle').innerHTML = message[0]["countNum"];
    document.getElementById('countNum').innerHTML = message[0]["countNum"];
    document.getElementById('docket').innerHTML = message[0]["docket"];
    document.getElementById('offenseStatute').innerHTML = message[0]["offenseTitle"] + " V.S.A. &sect " + message[0]["offenseSection"] + " (" + message[0]["offenseDesc"] + ")";
    document.getElementById('offenseStatus').innerHTML = message[0]["offenseStatus"];
    document.getElementById('date').innerHTML = message[0]["date"];

});