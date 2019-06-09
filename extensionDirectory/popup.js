let createPetition = document.getElementById('create-petition');
let clearData = document.getElementById('clear-data');
let addCounts = document.getElementById('add-docket-info');
let loadedMessage;
let docketInfo = document.getElementById('docketInfo');
let coverDiv = document.getElementById("coverDiv");


getData();

createPetition.onclick = function (element) {
    chrome.tabs.create({
        url: chrome.extension.getURL('./forms/petitionExpunge.html?1')
    })
};

clearData.onclick = function (element) {

    var r = confirm("Are you sure you want to clear all data for this petitioner?");
    if (r == true) {
        txt = "You pressed OK!";

        var myNode = document.getElementById("countCards");
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }
        document.getElementById('defendantName').innerHTML = "";
        document.getElementById('defendantDOB').innerHTML = "";
        document.getElementById('defendantAddress').innerHTML = "";
        chrome.storage.local.clear()
        coverDiv.style.display = "block";
    }

};


function getData() {
    chrome.storage.local.get(['expungevt'], function (result) {
        if (JSON.stringify(result) != "{}") {
            setPopUpData(result.expungevt[0])
            $("#coverDiv").toggle(false);
        }
    });
}



addCounts.onclick = function (element) {

    chrome.storage.local.get(['expungevt'], function (result) {
        if (JSON.stringify(result) != "{}") {
            countString = 'var hasCounts = true;'
        } else {
            countString = 'var hasCounts = false;'
        }
        chrome.tabs.executeScript(null, {
            code: countString
        }, function () {
            chrome.tabs.executeScript(null, { file: 'payload.js' });
        });
    });

};

// Listen to messages from the payload.js script and write to popout.html
chrome.runtime.onMessage.addListener(function (message) {
    loadedMessage = message[0]
    setPopUpData(loadedMessage)
    $("#coverDiv").toggle(false);
});

function setPopUpData(allData) {
    //defendant info
    document.getElementById('defendantName').innerHTML = allData.defName;
    document.getElementById('defendantDOB').innerHTML = allData.defDOB;
    document.getElementById('defendantAddress').innerHTML = getAddress(allData.defAddress);

    function getAddress(addrArray) {
        addressHTML = ""
        for (i = 0; i < addrArray.length; i++) {
            addressHTML += addrArray[i] + "<br>"
        }
        return addressHTML
    }

    $('#countCards').empty();
    for (i = 0; i < allData.totalCounts; i++) {
        count = allData.counts[i]
        dockNum = count.docketNum.trim();
        ctNum = count.countNum.trim();
        cardSelectID = "select" + dockNum + "-" + ctNum

        let card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = createCountCard(count)
        $('#countCards').append(card);
        $("#cardSelectID").val(count.filingType);
    }


}

function createCountCard(count) {

    dockNum = count.docketNum.trim();
    ctNum = count.countNum.trim();
    cardID = dockNum + "-" + ctNum
    let cardHTML = (`

        <div class="card-header" id=${"heading" + cardID}>
            <button class="btn btn-link btn-sm countCardBtn" type="button" data-toggle="collapse" data-target=${"#collapse" + cardID} aria-expanded="false" aria-controls=${"collapse" + cardID}>
                <div class="buttonLink">
                    <div id="button-top>
                        <div id="description-date>
                            <p>${count.description}</b></p>
                            <p>${count.dispositionDate + "  (" + getRelativeDate(count.dispositionDate) + " ago)"}</p>
                        </div>
                        <div id = "selectionDiv">
                            <select id=${"select" + cardID} class="petitionSelect selectpicker">
                                <option value="X">Ineligible</option>
                                <option value="ExC">Expunge Conviction</option>
                                <option value="ExNC">Expunge Nonconviction</option>
                                <option value="SC">Seal Conviction</option>
                            </select>
                        </div>
                    </div>


                    </i>
                    <ul class="nav md-pills nav-justified pills-rounded pills-outline-red smallPill" width="50" >
                        <li class="nav-item pillText">
                        <a class="nav-link active pillText" data-toggle="tab" href="#panel61" role="tab">${count.offenseClass} </a></li>
                    </ul>
                </div>
             </button>
                
        </div>

        <div id=${"collapse" + cardID} class="collapse " aria-labelledby=${"heading" + cardID} data-parent="#countCards">
            <div class="card-body">
                <p><b>Desc: </b>${"  " + count.description.trim()}</p>
                <p><b>Statute: </b>${"  " + count.titleNum + " V.S.A. &sect " + count.sectionNum + " (" + count.offenseClass + ")"}</p>
                <p><b>Disposition: </b>${"  " + count.offenseDisposition}</p>
                <table class="table">
                    <thead class="">
                        <th scope="col">Alleged Offense Date</th>
                        <th scope="col">Arrest / Citation Date</th>
                        <th scope="col">Disposition Date</th>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${count.allegedOffenseDate}</td>
                            <td>${count.arrestCitationDate}</td>
                            <td>${count.dispositionDate}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `);

    return cardHTML

    function getRelativeDate(date) {

        // dateArray = date.split("/")

        // relDate = moment(date,"M/D/YY").fromNow()


        let fromTime = moment(date, "M/D/YY").diff(moment(), "milliseconds")
        let duration = moment.duration(fromTime)
        let years = duration.years() / -1
        let months = duration.months() / -1
        let days = duration.days() / -1
        if (years > 0) {
            var Ys = years == 1 ? years + "y " : years + "y "
            var Ms = months == 1 ? months + "m " : months + "m "
            return Ys + Ms
        } else {
            if (months > 0)
                return months == 1 ? months + "m " : months + "m "
            else
                return days == 1 ? days + "d " : days + "d "
        }

    }

}





$('body').on('change', 'select.petitionSelect', function () {

    selectID = this.id
    filingType = this.value
    chrome.storage.local.get(['expungevt'], function (result) {

        for (i = 0; i < result.expungevt[0]["counts"].length; i++) {
            countID = "select" + result.expungevt[0]["counts"][i].docketNum.trim() + "-" + result.expungevt[0]["counts"][i].countNum.trim()

            if (countID === selectID) {
                result.expungevt[0]["counts"][i]["filingType"] = filingType
            }

        }
        chrome.storage.local.set({
            expungevt: result.expungevt
        });
        console.log(result.expungevt)

    });
});

