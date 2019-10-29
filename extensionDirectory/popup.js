let loadedMessage;

initButtons();
initListeners();

function initButtons() {
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
            chrome.storage.local.set({
                counts: combinedData
            });
        $('body').addClass('active');
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
    let clearCountFromLocalStorage = function() {

        chrome.storage.local.get('counts', function(result) {
            counts = result.counts["counts"]
            index = counts.findIndex(x => x.uid === countId);
            counts.splice(index, 1)
            result.counts["counts"] = counts

            chrome.storage.local.set({
                counts: result.counts
            });
        });
    }
    clearCountFromLocalStorage()
}





function resetSettings(element) {
    var confirmed = confirm("Are you sure you want to reset setting to the defaults?");
    if (confirmed == true) {
        chrome.storage.local.remove(['settings'])
    }
};

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

    //if there is no old data, then the new data is what we'll use
    if (oldData === undefined) {
        return newData
    }
    //if the petitioner is not the same, we'll use the old data
    if (!isSamePetitioner()) 
    {
        return oldData
    }

    var returnData = oldData
    var newCounts = newData.counts

    for (count in newCounts) {
        var currentCount = newCounts[count]
        console.log(currentCount.uid)
        if (oldData.counts.filter(count => count.uid === currentCount.uid).length = 0) {
            returnData.counts.push(currentCount)
        }
    }

    var totalMatchCount = (oldData.counts.length + newData.counts.length) - returnData.counts.length

    if (totalMatchCount > 0) {
        alert(`${totalMatchCount} counts matched existing counts and were not added.`)
    }

    return returnData


    function isSamePetitioner(){
        var oldName = oldData["defName"];
        var newName = newData["defName"];
        if (oldName != newName) {
            return confirm(`"The name on the counts you are trying to add is ${newName}, which is not the same as ${oldName}. Are you sure you want to continue?`);
        }
        return true
    }
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
        "defDOB": parseDateFromDocket(defDOB),
        "defAddress": addressArray.join('\n'),
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
        countObject["allegedOffenseDate"] = parseDateFromDocket(allegedOffenseDate.trim());

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
        countObject["arrestCitationDate"] = parseDateFromDocket(arrestCitationDate.trim());
    }
    catch (err) {
        countObject["arrestCitationDate"] = "Check Docket"
        console.log("Error:" + err)
    }
}
function parseDateFromDocket(date){
    return moment(date, 'MM/DD/YYYY').format("YYYY-MM-DD");
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

