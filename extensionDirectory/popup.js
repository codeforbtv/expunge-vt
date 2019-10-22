let loadedMessage;

getData();
initButtons();
initListeners();

function initButtons() {
    $("[data-add-counts]").click(addDocketCounts)
    $("[data-edit]").click(editPetitioner)
    $("[data-edit-counts]").click(openManagePage)
    $("[data-generate]").click(openPetitionsPage)
    $("[data-clear]").click(confirmClearData)
    $("[data-reset]").click(resetSettings)

}

function initListeners() {
    // Listen to messages from the payload.js script and write to popout.html
    chrome.runtime.onMessage.addListener(function(message) {
        console.log("message: "+JSON.stringify(message))
        newData = getPetitionerInfo(message);
        console.log("newData: "+ JSON.stringify(newData))
        chrome.storage.local.get('counts', function(result) {
            combinedData = appendDataWithConfirmation(newData, result.counts)
            renderPopup(combinedData)
            chrome.storage.local.set({
                counts: combinedData
            });
        $('body').addClass('active');
        });
    });

    //Update chrome storage when a petition is selected
    $('body').on('change', 'select.petitionSelect', function(event) {

        console.log(event.target)

        selectID = this.id
        filingType = this.value
        chrome.storage.local.get('counts', function(result) {
            console.log("select-fetch: "+JSON.stringify(result))
            for (i = 0; i < result.counts["counts"].length; i++) {
                countID = "select" + result.counts["counts"][i].uid;
                if (countID === selectID) {
                    result.counts["counts"][i]["filingType"] = filingType
                }
            }
            console.log("select-fetch-updated: "+JSON.stringify(result))

            chrome.storage.local.set({
                counts: result.counts
            });
        });
    });

    $('body').on('click', 'select.petitionSelect', function(event) {
        //prevents the select in the petition cards from opening the accordion.
        event.stopPropagation();
    });

    $('body').on('click', 'i.countDeleter', function(event) {
        //prevents the delete icon in the petition cards from opening the accordion.
        event.stopPropagation();

        var countId = this.id.replace("del", "");
        confirmDeleteCount(countId)

    });

}
//Delete count from popup and from storage when delete file is selected
function confirmDeleteCount(countId) {

    chrome.storage.local.get('counts', function(result) {

        //see how many counts are left
        //if there's just one, and the user confirms, clear all data
        //if there's more than one, and the user confirms, just remove that one count.
        let numCounts = result.counts["counts"].length
        if (numCounts <= 1) {
            var confirmDeleteLast = confirm("Are you sure that you would like to delete the last count, this will clear all petitioner information.");
            if (confirmDeleteLast == true) {
                clearData()
            }
        } else {
            var counts = result.counts["counts"]
            var currentCount = counts.filter(count => count.uid == countId)[0]
            console.log(currentCount)
            var confirmDelete = confirm(`Are you sure that you would like to delete the count \"${currentCount.description}\"?`);
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

    let clearCountFromLocalStorage = function() {

        chrome.storage.local.get('counts', function(result) {
            counts = result.counts["counts"]
            index = counts.findIndex(x => x.uid === countId);
            counts.splice(index, 1)
            result.counts["counts"] = counts

            chrome.storage.local.set({
                counts: result.counts
            });
        $('#runningCount').html(getRunningCountString(counts.length));

        });

    }

    clearCountFromPopup()
    clearCountFromLocalStorage()

}

function getRunningCountString(countLength) {
    return "Counts (" + countLength +")"
}

function openPetitionsPage(element) {

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let index = tabs[0].index;
        chrome.tabs.create({
            url: chrome.extension.getURL('./filings.html'),
            index: index + 1,
        })
    })
};
function openManagePage(element) {

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let index = tabs[0].index;
        chrome.tabs.create({
            url: chrome.extension.getURL('./manage-counts.html'),
            index: index + 1,
        })
    })
};

function confirmClearData(element) {

    var r = confirm("Are you sure you want to clear all data for this petitioner?");
    if (r == true) {

        clearData()
    }
};

function clearData() {


    chrome.storage.local.remove(['counts','responses'],function(){
        $('#countCards').empty()
        $('.pet-detail').text("");
        $('body').removeClass('active');
    })
}

function resetSettings(element) {
    var confirmed = confirm("Are you sure you want to reset setting to the defaults?");
    if (confirmed == true) {
        chrome.storage.local.remove(['settings'])
    }
};

function editPetitioner() {
    var value = $('.pet-detail').attr('contenteditable');
    if (value == 'false') {
        $("[data-edit]").html("Save");
        $('.pet-detail').attr('contenteditable', 'true');
    } else {
        $("[data-edit]").html("Edit");
        $('.pet-detail').attr('contenteditable', 'false');

        savePetitonerData();
    }
};

function savePetitonerData() {
    chrome.storage.local.get('counts', function(result) {

        //defendant info
        result.counts.defName = $("#defendantName").html();
        result.counts.defDOB = $("#defendantDOB").html();
        var address = $("#defendantAddress").html()

        result.counts.defAddress = addressArrayFromHTML(address)

        chrome.storage.local.set({
            counts: result.counts
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
    });
}

function getData() {
    chrome.storage.local.get('counts', function(result) {
        console.log("getting data:" + JSON.stringify(result));
        if (JSON.stringify(result) != "{}") {
            renderPopup(result.counts)
            $('body').addClass('active');

        }
    });
}

function addDocketCounts() {
    chrome.tabs.executeScript(null, { file: 'payload.js' });
};


function renderPopup(allData) {
    //defendant info

    $('#defendantName').html(allData.defName);
    $('#defendantDOB').html(allData.defDOB);
    $('#defendantAddress').html(allData.defAddress.join("<br>"));
    $('#countCards').empty();
    $('#runningCount').html(getRunningCountString(allData.counts.length));

    for (countIndex in allData.counts) {
        count = allData.counts[countIndex]
        $('#countCards').append(generateCountCardHTML(count, allData.defDOB));
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
                                <option value="ExNC">Expunge Non-Conviction</option>
                                <option value="ExNCrim">Expunge Non-Criminal</option>
                                <option value="SC">Seal Conviction</option>
                                <option value="SDui">Seal DUI</option>
                                <option value="StipExC">(Stip) Expunge Conviction</option>
                                <option value="StipExNC">(Stip) Expunge Non-Conviction</option>
                                <option value="StipExNCrim">(Stip) Expunge Non-Criminal</option>
                                <option value="StipSC">(Stip) Seal Conviction</option>
                                <option value="StipSDui">(Stip) Seal DUI</option>

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
                            ${getOutstandingPaymentHTML(count.outstandingPayment)}
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
            return "<p class='card-header__disposition-date'> Est. Disposition: " + moment(dispDate).format('L') + "  (" + getRelativeDate(dispDate) + " ago) </p>"
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

        let fromTime = moment(date).diff(moment(), "milliseconds")
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
        console.log(count,count.offenseDisposition)
        var dispositionNormalized = count.offenseDisposition.toLowerCase();
        if (dispositionNormalized === "dismissed by state" || dispositionNormalized === "dismissed by court") {
            return "pill--outline-green"
        } else {
            return "pill--outline-black"
        }
    }

    function getAgeAtDispositionHTML(date) {

        dobArray = date.split("/")
        let fromTime = new Date(dobArray[2], dobArray[0] - 1, dobArray[1]);

        dispoDate = count.dispositionDate
        let toTime = moment(dispoDate, "MM-DD-YY")

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

    function getOutstandingPaymentHTML(paymentDue) {
        var spanHTML = ""
        if (paymentDue) {
            spanHTML = "<span class='pill pill--rounded pill--outline-black'>Surcharge</span>"
        }
        return spanHTML
    }

}



function appendDataWithConfirmation(newData, oldData) {
    console.log("new" + JSON.stringify(newData),"old" + JSON.stringify(oldData))

    if (oldData === undefined) {
        return newData
    }
    if (!isSamePetitioner()) 
    {
        return oldData
    }

    function isSamePetitioner(){
        var oldName = oldData["defName"];
        var newName = newData["defName"];
        if (oldName != newName) {
            return confirm(`"The name on the counts you are trying to add is ${newName}, which is not the same as ${oldName}. Are you sure you want to continue?`);
        }
        return true
    }

    var returnData = oldData

    var newCounts = newData.counts

    for (count in newCounts) {
        var currentCount = newCounts[count]
        if (oldData.counts.filter(count => count.uid === currentCount.uid).length > 0) {
            returnData.counts.push(currentCount)
        }
    }

    var totalMatchCount = (oldData.counts.length + newData.counts.length) - returnData.counts.length

    if (totalMatchCount > 0) {
        alert(`${totalMatchCount} counts matched existing counts and were not added.`)
    }

    return returnData
}
 

function getPetitionerInfo(rawData) {

    console.log("gettingPetitionerInfo")
    //Get Defendant Name
    nameLocation = nthIndex(rawData, "Defendant:", 1) + 15
    nameLocationEnd = nthIndex(rawData, "DOB:", 1) - 40
    defName = rawData.substring(nameLocation, nameLocationEnd)

    //Get Date of Birth
    dobLocation = nthIndex(rawData, "DOB:", 1) + 15
    dobLocationEnd = nthIndex(rawData, "POB:", 1) - 40
    defDOB = rawData.substring(dobLocation, dobLocationEnd)

    //Get Address
    try {
        //match all between address and next hearing
        addressString = rawData.match(/(?<=Address:)\s+.*(?=Next Hearing:)/gms)
        addressArray = addressString[0].split("\n")
        addressArray.pop()
        //trims off disposed text and excess spaces
        addressArray[1] = addressArray[1].match(/([ \t]{6,})(.*)/gms).toString()
    } catch {
        addressArray = [];
        addressArray[0] = "No Address found"
    }

    for (i = 0; i < addressArray.length; i++) {
        addressArray[i] = addressArray[i].trim()
    }

    //get docket Num
    docketSheetNum = rawData.match(/([Docket No.\s+])(\d.*?cr)/)[0].trim()

    //create all counts object
    parsedData = {
        "defName": defName,
        "defDOB": defDOB,
        "defAddress": addressArray,
        "counts": getCountInfo(rawData),
    }

    return parsedData;

}

function getCountInfo(rawData) {

    divider = "================================================================================"


    //Determine Number of Counts and create array with each line count
    countsStart = nthIndex(rawData, divider, 2) + divider.length + 1
    countsEnd = rawData.substring(countsStart).indexOf("=") + countsStart
    allCountsBody = rawData.substring(countsStart, countsEnd)
    countTotal = (allCountsBody.match(/\n/g) || []).length / 2;
    countTotal = Math.ceil(countTotal)
    allCountsArray = allCountsBody.split("\n")

    //Move data from count table into objects
    countLines = countTotal * 2

    var counts = []
    for (i = 0; i < countLines; i++) {
        //Catch Line 1 (odd lines) of each count
        if ((i + 1) % 2 != 0) {
            countObject = {};
            processCountLine1(allCountsArray[i], i / 2, rawData)
        } else { //Catch Line 2 of each count
            description = allCountsArray[i].trim()
            console.log("description: "+description)
            description = description.replace(/\//g, " / ")
            description = description.replace(/\s\s/g, " ")
            countObject["description"] = description

            counts.push(countObject)
        }
    }
    return counts
}


function isSurchageDue(rawData) {

    //if a surchage is entered in the record there is at least one def-pay section
    //if the surchage was due and has been paid, there is a finpay section.
    //if there is a defpay record and no fin pay record, then a surchage is due.
    //if there is no defpay and no finpay, then no surchage is due.

    var isSurchageDue = (surchargeCreated() && !finalPayment())

    return isSurchageDue;

    function surchargeCreated() {
        return rawData.includes("defpay") || rawData.includes("surcharge assessed") || rawData.includes("Referred to collection agency") || rawData.includes("referred to collection agency");;

    }
    function finalPayment() {
        return rawData.includes("finpay") || rawData.includes("paid in full")
    }
}

//Break line one of a count into its individual fields
function processCountLine1(countLine1, countNum, rawData) {
    //Break into array and remove spaces
    countLine1Array = countLine1.split(" ")
    countLine1Array = countLine1Array.filter(function (el) {
        return el != "";
    });

    //find location of fel/mis
    felMisLocation = countLine1Array.findIndex(isFelOrMisd);



    //get section string(s)
    for (j = 5; j < felMisLocation; j++) {
        if (j === 5) {
            offenseSection = countLine1Array[j]
        } else {
            offenseSection = offenseSection + " " + countLine1Array[j]
        }
    }

    // get disposition string
    disposition = ""
    for (j = (felMisLocation + 2); j < countLine1Array.length; j++) {
        if (j === 8) {
            disposition = countLine1Array[j]
        } else {
            disposition = disposition + " " + countLine1Array[j]
        }
    }

    var uid = docketSheetNum + countLine1Array[0] + countLine1Array[1] + checkDisposition(disposition);
    uid = uid.split(' ').join('_');

    //Create count object with all count line 1 items
    countObject = {
        "guid": guid(),
        "uid": uid,
        "countNum": countLine1Array[0],
        "docketNum": countLine1Array[1],
        "docketCounty": countLine1Array[2],
        "county": countyNameFromCountyCode(countLine1Array[2]),
        "titleNum": countLine1Array[4],
        "sectionNum": offenseSection,
        "offenseClass": countLine1Array[felMisLocation],
        "dispositionDate": countLine1Array[felMisLocation + 1],
        "offenseDisposition": checkDisposition(disposition),
        "filingType": "",
        "docketSheetNum": docketSheetNum,
        "outstandingPayment": isSurchageDue(rawData)
    }

    function checkDisposition() {
        disposition = disposition.trim()
        if (disposition == "") {
            return "pending"
        } else {
            return disposition
        }
    }
    function isFelOrMisd(element) {
        if (element === "mis" || element === "fel") {
            return element;
        };
        return false;
    }

    //Get Alleged offense date:
    try {
        offenseDateArray = rawData.match(/Alleged\s+offense\s+date:\s+(\d\d\/\d\d\/\d\d)/gi)
        offenseDateString = offenseDateArray[countNum];
        offenseDateLocation = offenseDateString.length;
        offenseDateLocationEnd = offenseDateLocation - 8
        allegedOffenseDate = offenseDateString.substring(offenseDateLocation, offenseDateLocationEnd);
        countObject["allegedOffenseDate"] = allegedOffenseDate.trim();
        console.log("allegedOffenseDate: " + allegedOffenseDate.trim())

    }
    catch (err) {
        countObject["allegedOffenseDate"] = "Check Docket";
        console.log("Error:" + err);
    }

    //Get Arrest/citation date:
    try {
        arrestDateArray = rawData.match(/Arrest\/Citation\s+date:\s+(\d\d\/\d\d\/\d\d)/gi);
        arrestDateString = arrestDateArray[countNum];
        arrestDateLocation = arrestDateString.length;
        arrestDateLocationEnd = arrestDateLocation - 8;
        arrestCitationDate = arrestDateString.substring(arrestDateLocation, arrestDateLocationEnd);
        countObject["arrestCitationDate"] = arrestCitationDate.trim();
    }
    catch (err) {
        countObject["arrestCitationDate"] = "Check Docket"
        console.log("Error:" + err)
    }
}

function nthIndex(str, subStr, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(subStr, i);
        if (i < 0) break;
    }
    return i;
}

function countyNameFromCountyCode(countyCode) {
    counties = {
        "Ancr": "Addison",
        "Bncr": "Bennington",
        "Cacr": "Caledonia",
        "Cncr": "Chittenden",
        "Excr": "Essex",
        "Frcr": "Franklin",
        "Gicr": "Grand Isle",
        "Lecr": "Lamoille",
        "Oecr": "Orange",
        "Oscr": "Orleans",
        "Rdcr": "Rutland",
        "Wncr": "Washington",
        "Wmcr": "Windham",
        "Wrcr": "Windsor"
    }
    return counties[countyCode]
}
function countyCodeFromCounty(county) {
    countyCodes = {
        "Addison": "Ancr",
        "Bennington": "Bncr",
        "Caledonia" : "Cacr",
        "Chittenden" : "Cncr",
        "Essex": "Excr",
        "Franklin": "Frcr",
        "Grand Isle" : "Gicr",
        "Lamoille" : "Lecr",
        "Orange" : "Oecr",
        "Orleans" : "Oscr",
        "Rutland" : "Rdcr",
        "Washington": "Wncr",
        "Windham" : "Wmcr",
        "Windsor" : "Wrcr"
    }
    return countyCodes[county]
}


function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

