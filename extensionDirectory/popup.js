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
    injectPayload();
    // if (window.confirm("Are you sure?")) {
    //     injectPayload();
    // }
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
    setPopUpData(message[0])

});

function setPopUpData(counts) {
    //defendant info
    document.getElementById('defendantName').innerHTML = counts.defName;
    document.getElementById('defendantDOB').innerHTML = counts.defDOB;

    for (i = 0; i < counts.totalCounts; i++) {
        console.log(i)
        let card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = createCountCard(counts.counts[i])
        $('#countCards').append(card);
    }


}


function createCountCard(count) {
    console.log(count)
    let cardHTML = (`

    <div class="card">
        <div class="card-header" id=${"heading" + count.countNum}>
                <button class="btn btn-link btn-sm countCardBtn" type="button" data-toggle="collapse" data-target=${"#collapse" + count.countNum} aria-expanded="false" aria-controls=${"collapse" + count.countNum}>
                <div class="buttonLink">
                <i class="fas fa-gavel"></i> ${count.docketNum.trim() + "/" + count.countNum.trim() + ": " + count.description.substring(0,14).trim()}
                </div>
                </button>
                
        </div>

        <div id=${"collapse" + count.countNum} class="collapse " aria-labelledby=${"heading" + count.countNum} data-parent="#countCards">
            <div class="card-body">
               <p><b>${count.titleNum + " V.S.A. &sect " + count.sectionNum + "</b> - " + count.description}</p>

            </div>
        </div>
    </div>
    `);

    return cardHTML
}