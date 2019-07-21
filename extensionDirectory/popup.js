let loadedMessage;

getData();
initButtons();
initListeners();

function initButtons(){
    $("[data-add-counts]").click(addDocketCounts)
    $("[data-edit]").click(editPetitioner)
    $("[data-generate]").click(openPetitionsPage)
    $("[data-clear]").click(confirmClearData)
}

function initListeners(){
    // Listen to messages from the payload.js script and write to popout.html
    chrome.runtime.onMessage.addListener(function (message) {
        loadedMessage = message[0]
        renderPopup(loadedMessage)
        $('body').addClass('active');

    });

    //Update chrome storage when a petition is selected
    $('body').on('change', 'select.petitionSelect', function () {
        
        selectID = this.id
        filingType = this.value
        chrome.storage.local.get(['expungevt'], function (result) {
            for (i = 0; i < result.expungevt[0]["counts"].length; i++) {
                countID = "select" + result.expungevt[0]["counts"][i].uid;

                if (countID === selectID) {
                    result.expungevt[0]["counts"][i]["filingType"] = filingType
                }
            }
            chrome.storage.local.set({
                expungevt: result.expungevt
            });
        });
    });

    //prevents the select in the petition cards from opening the accordion.
    $('body').on('click', 'select.petitionSelect', function(event){
        event.stopPropagation();
    });

    $('body').on('click', 'i.countDeleter', function (event) {
        //prevents the delete icon in the petition cards from opening the accordion.
        event.stopPropagation();
        var selectId = this.id.replace("del","");
        confirmDeleteCount(selectId)

    });


}
//Delete count from popup and from storage when delete file is selected
function confirmDeleteCount(countId) {

    chrome.storage.local.get(['expungevt'], function (result) {

        //see how many counts are left
        //if there's just one, and the user confirms, clear all data
        //if there's more than one, and the user confirms, just remove that one count.
        let numCounts = result.expungevt[0]["counts"].length
        if (numCounts <= 1){
        var confirmDeleteLast = confirm("Are you sure that you would like to delete the last count, this will clear all petitioner information.");
            if (confirmDeleteLast == true) {
                clearData()
            }
        } else {

        var counts = result.expungevt[0]["counts"]
        var currentCount = counts.filter(count => count.uid == countId)
        var confirmDelete = confirm(`Are you sure that you would like to delete the count \"${currentCount[0].description}\"?`);
            if (confirmDelete == true) {
                deleteCount(countId)
            }
        }
    })
}
function deleteCount(countId){

    let clearCountFromPopup = function() {
        headingID = "#heading" + countId;
        collapseID = "#collapse" + countId;
        $(headingID).remove();
        $(collapseID).remove();
    }

    let clearCountFromLocalStorage = function(){

        chrome.storage.local.get(['expungevt'], function (result) {
            counts = result.expungevt[0]["counts"]
            index = counts.findIndex(x => x.uid === countId);
            counts.splice(index,1)
            result.expungevt[0]["counts"] = counts

            chrome.storage.local.set({
                expungevt: result.expungevt
            });
        });

    }

    clearCountFromPopup()
    clearCountFromLocalStorage()

}

function openPetitionsPage(element) {

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

function confirmClearData(element){

    var r = confirm("Are you sure you want to clear all data for this petitioner?");
    if (r == true) {
 
        clearData()
    }
};

function clearData(){
    var allCards = document.getElementById("countCards");
        while (allCards.firstChild) {
            allCards.removeChild(allCards.firstChild);
        }
        $('.pet-detail').text = "";

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

function resetSettings(element){

    var r = confirm("Are you sure you want to reset setting to the defaults?");
    if (r == true) {
        chrome.storage.local.set({
            expungevtSettings: ""
        });
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

function savePetitonerData() {
    chrome.storage.local.get(['expungevt'], function(result) {

        //defendant info
        result.expungevt[0].defName = $("#defendantName").html();
        result.expungevt[0].defDOB = $("#defendantDOB").html();
        var address = $("#defendantAddress").html()
        console.log(address)
        result.expungevt[0].defAddress = addressArrayFromHTML(address)

        chrome.storage.local.set({
            expungevt: result.expungevt
        });

        function addressArrayFromHTML(addressHTMLString) {
            addressHTMLString = $("#defendantAddress").html().replace(/<\/div>/g, "<br>")
            addressHTMLString = addressHTMLString.replace(/<div>/g, "<br>")
            addressHTMLString = addressHTMLString.split('<br>')
            var array = addressHTMLString.filter(function(el) {
                return el != "";
            });
            return array
        }
        console.log(result.expungevt[0].defAddress)
    });
}

function getData() {
    chrome.storage.local.get(['expungevt'], function (result) {
        if (JSON.stringify(result) != "{}") {
            console.log(result.expungevt[0])
            renderPopup(result.expungevt[0])
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


function renderPopup(allData) {
    //defendant info

    $('#defendantName').html(allData.defName);
    $('#defendantDOB').html(allData.defDOB);
    $('#defendantAddress').html(allData.defAddress.join("<br>"));
    $('#countCards').empty();

    for (countIndex in allData.counts) {
        count = allData.counts[countIndex]
        $('#countCards').append(generateCountCardHTML(count,allData.defDOB));
        $("#select" + count.uid).val(count.filingType);
    }
}

function generateCountCardHTML(count, dob) {
    return (`
        <div class="card">
        <div class="card-header" id="${"heading" + count.uid}" type="button" data-toggle="collapse" data-target="${"#collapse" + count.uid}" aria-expanded="false" aria-controls="${"collapse" + count.uid}">
                <div class="card-header__column">
                    <div class="card-header__title-row">
                        <div id="description-date" class="card-header__meta-data">
                        <button class="card-header__description btn btn-link btn-sm" >
                            <p>${count.description}</p>
                         </button> ${checkDisposition()}
                        </div>
                        <div id="selectionDiv" class="card-header__select">
                            <select id="${"select" + count.uid}" class="petitionSelect selectpicker">
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
                    <div class="card-header__bottom-row">
                        <div class="card-header__pills-row">
                            <span class="pill pill--rounded ${offenseTypeColor()}">
                                ${count.offenseClass}
                            </span>
                            <span class="pill pill--rounded ${dispositionColor()}">
                                ${count.offenseDisposition}
                            </span>
                            ${getAgeAtDispositionHTML(dob)}
                        </div>
                        <i id=${"del" + count.uid} class="fas fa-folder-minus countDeleter"></i>
                    </div>
                </div>
        </div>

        <div id="${"collapse" + count.uid}" class="collapse" aria-labelledby="${"heading" + count.uid}" data-parent="#countCards">
            <div class="card-body">
                <p><b>Desc: </b>${count.description.trim()}</p>
                <p><b>Statute: </b>${count.titleNum} V.S.A. &sect ${count.sectionNum} (${count.offenseClass})</p>
                <p><b>Disposition: </b>${count.offenseDisposition}</p>
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
        </div>
    `);

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

    function getAgeAtDispositionHTML(date) {

        dobArray = date.split("/")
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



