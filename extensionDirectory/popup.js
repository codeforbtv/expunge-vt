let loadedMessage;

getData();
initButtons();
initListeners();

function initButtons(){
    $("[data-add-counts]").click(addDocketCounts)
    $("[data-edit]").click(editPetitioner)
    $("[data-generate]").click(createPetition)
    $("[data-clear]").click(clearData)
}

function initListeners(){
    // Listen to messages from the payload.js script and write to popout.html
    chrome.runtime.onMessage.addListener(function (message) {
        loadedMessage = message[0]
        console.log(loadedMessage)
        setPopUpData(loadedMessage)
        $('body').addClass('active');

    });

    //Update chrome storage when a petition is selected
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

    //prevents the select in the petition cards from opening the accordion.
    $('body').on('click', 'select.petitionSelect', function(event){
        event.stopPropagation();
    });
}

function createPetition(element) {

    chrome.tabs.query({
        active: true, currentWindow: true
    }, tabs => {
        let index = tabs[0].index;
        chrome.tabs.create({
            url: chrome.extension.getURL('./filings.html'),
            index: index + 1,
        })
    })
};

function clearData(element){

    var r = confirm("Are you sure you want to clear all data for this petitioner?");
    if (r == true) {
 
        var allCards = document.getElementById("countCards");
        while (allCards.firstChild) {
            allCards.removeChild(allCards.firstChild);
        }
        $('.pet-detail').text = "";
        chrome.storage.local.clear()

        chrome.storage.local.get(['expungevtSettings'], function (result) {
            console.log(result.expungevtSettings)
            chrome.storage.local.clear(function(){
                chrome.storage.local.set({
                    expungevtSettings: result.expungevtSettings
                });
            })
            
        });

        $('body').removeClass('active');
    }
};


function editPetitioner() {
    var value = $('.pet-detail').attr('contenteditable');
    if (value == 'false') {
        $("[data-edit]").html("Save");
        $('.pet-detail').attr('contenteditable', 'true');
    }
    else {
        $("[data-edit]").html("Edit");
        $('.pet-detail').attr('contenteditable', 'false');

        savePetitonerData();
    }
};
function savePetitonerData(){
    chrome.storage.local.get(['expungevt'], function (result) {

            //defendant info
            result.expungevt[0].defName = $("#defendantName").html();
            result.expungevt[0].defDOB = $("#defendantDOB").html();
            setAddress()

            chrome.storage.local.set({
                expungevt: result.expungevt
            });

            function setAddress(addrHTML) {
                addressString = $("#defendantAddress").html().replace(/<\/div>/g, "<br>")
                addressString = addressString.replace(/<div>/g, "<br>")
                addressHTML = addressString.split('<br>')
                var filteredHTML = addressHTML.filter(function (el) {
                    return el != "";
                });
                for (i = 0; i < filteredHTML.length; i++) {
                    result.expungevt[0].defAddress[i] = filteredHTML[i]
                }
            }
            console.log(result.expungevt[0].defAddress)

        });
}

function getData() {
    chrome.storage.local.get(['expungevt'], function (result) {
        if (JSON.stringify(result) != "{}") {
            setPopUpData(result.expungevt[0])
            $('body').addClass('active');

        }
    });
}



function addDocketCounts() {

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


function setPopUpData(allData) {
    //defendant info
    document.getElementById('defendantName').innerHTML = allData.defName;
    document.getElementById('defendantDOB').innerHTML = allData.defDOB;
    document.getElementById('defendantAddress').innerHTML = getAddress(allData.defAddress);

    console.log(allData.defAddress)
    function getAddress(addrArray) {
        addressHTML = ""
        for (i = 0; i < addrArray.length; i++) {
            if (i === addrArray.length - 1) {
                addressHTML += addrArray[i]
            } else {
                addressHTML += addrArray[i] + "<br>"
            }
        }
        return addressHTML
    }

    $('#countCards').empty();
    for (i = 0; i < allData.totalCounts; i++) {
        count = allData.counts[i]
        dockNum = count.docketNum.trim();
        ctNum = count.countNum.trim();
        cardSelectID = "#select" + dockNum + "-" + ctNum

        let card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = createCountCard(count, allData.defDOB)
        $('#countCards').append(card);
        $(cardSelectID).val(count.filingType);
    }
}

function createCountCard(count, dob) {
    dockNum = count.docketNum.trim();
    ctNum = count.countNum.trim();
    cardID = dockNum + "-" + ctNum
    let cardHTML = (`
        <div class="card-header" id=${"heading" + cardID} type="button" data-toggle="collapse" data-target=${"#collapse" + cardID} aria-expanded="false" aria-controls=${"collapse" + cardID}>
                <div class="card-header__column">
                    <div class="card-header__title-row">
                        <div id="description-date" class="card-header__meta-data">
                        <button class="card-header__description btn btn-link btn-sm" >
                            <p>${count.description}</p>
                         </button> ${checkDisposition()}
                        </div>
                        <div id="selectionDiv" class="card-header__select">
                            <select id=${"select" + cardID} class="petitionSelect selectpicker">
                                <option value="">No Filing</option>
                                <option value="X">Ineligible</option>
                                <option value="ExC">Expunge Conviction</option>
                                <option value="ExNC">Expunge Nonconviction</option>
                                <option value="SC">Seal Conviction</option>
                                <option value="StipExC">(Stip) Expunge Conviction</option>
                                <option value="StipExNC">(Stip) Expunge Nonconviction</option>
                                <option value="StipSC">(Stip) Seal Conviction</option>
                            </select>
                        </div>
                    </div>

                    <div class="card-header__pills-row">
                        <span class="pill pill--rounded ${offenseTypeColor()}">
                            ${count.offenseClass}
                        </span>
                        <span class="pill pill--rounded ${dispositionColor()}">
                            ${count.offenseDisposition}
                        </span>
                        ${getAgeAtDispositionHTML()}
                    </div>
                </div>
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
                            <td>${checkDispositionDetail()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `);

    return cardHTML

    function checkDisposition() {
        dispDate = count.dispositionDate
        if (dispDate == "" || dispDate == null) {
            return ""
        } else {
        return "<p class='card-header__disposition-date'> Est. Disposition: " + dispDate + "  (" + getRelativeDate(dispDate) + " ago) </p>"
        }
    }

    function checkDispositionDetail() {
        dispDate = count.dispositionDate
        if (dispDate == "" || dispDate == null) {
            return "pending"
        } else {
            return dispDate
        }
    }

    function getRelativeDate(date) {

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
    function offenseTypeColor() {

        if (count.offenseClass === "fel") {
            return "pill--outline-black"
        } else {
            return "pill--outline-green"
        }
    }

    function dispositionColor() {

        if (count.offenseDisposition === "Dismissed by state") {
            return "pill--outline-green"
        } else {
            return "pill--outline-black"
        }
    }

    function getAgeAtDispositionHTML() {

        dobArray = dob.split("/")
        let fromTime = new Date(dobArray[2], dobArray[0]-1, dobArray[1]);
        
        dispoDate = count.dispositionDate
        let toTime = moment(dispoDate, "MM/DD/YY")

        ageSinceOffense = toTime.diff(fromTime, "years", true).toFixed(2);

        if (ageSinceOffense < 18) {
            spanHTML = "<span class='pill pill--rounded pill--outline-green'> under 18 </span>"
        } else if (ageSinceOffense < 21) {
            spanHTML = "<span class='pill pill--rounded pill--outline-green'> under 21 </span>"
        } else {
            spanHTML = "<span class='pill pill--rounded pill--outline-black'> adult </span>"
        }
        return spanHTML
    }
}



