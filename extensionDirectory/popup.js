let createPetition = document.getElementById('create-petition');
let resetDocket = document.getElementById('reset-docket-info');
let newElement = `'<span style="color:red">TEST</span>'`;
let loadedMessage;
let docketInfo = document.getElementById('docketInfo');

createPetition.onclick = function (element) {
    chrome.tabs.create({
        url: chrome.extension.getURL('formMenu.html#window')
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

window.addEventListener('load', function (evt) {

    // let storageCounts = JSON.parse(localStorage.getItem('counts'))
    // alert(storageCounts)

    // setPopUpData(storageCounts[0]);


    // chrome.tabs.executeScript({
    //     code: 'JSON.stringify(localStorage)'
    // }, res => {
    //     lsObj = JSON.parse(res[0])
    //     key = "counts"
    //     // ls.innerHTML = lsHtml ? lsHtml : "The active tab has nothing in localStorage";
    //     setPopUpData(JSON.parse(lsObj[key]));
    // })


    // chrome.storage.sync.set({key: value}, function() {
    //     console.log('Value is set to ' + value);
    //   });

    //   chrome.storage.sync.get(['key'], function(result) {
    //     console.log('Value currently is ' + result.key);
    //   });
})


// Listen to messages from the payload.js script and write to popout.html
chrome.runtime.onMessage.addListener(function (message) {

    loadedMessage = message
    setPopUpData(message)

});

function setPopUpData(counts) {

    //docket info
    document.getElementById('pagetitle').innerHTML = counts[0]["docket"];
    //count info

    document.getElementById('countNum').innerHTML = counts[0]["countNum"];
    // document.getElementById('docket').innerHTML = counts[0]["docket"];
    document.getElementById('offenseStatute').innerHTML = counts[0]["offenseTitle"] + " V.S.A. &sect " + counts[0]["offenseSection"] + " (" + counts[0]["offenseDesc"] + ")";
    document.getElementById('offenseStatus').innerHTML = counts[0]["offenseStatus"];
    document.getElementById('date').innerHTML = counts[0]["date"];



    // chrome.storage.sync.set({
    //     "counts": 4
    // })

    // chrome.storage.local.get(function(result){console.log(result)})
}
