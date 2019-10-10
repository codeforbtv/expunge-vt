// send the page title as a chrome message
docketBody = document.getElementsByTagName("pre")[0].innerHTML

divider = "================================================================================"


petitionerCountObject = getPetitionerInfo();
petitionerCountObject = getCountInfo(petitionerCountObject);

if (hasCounts == false) {
    chrome.storage.local.set({
        expungevt: petitionerCountObject
    });
    chrome.runtime.sendMessage(petitionerCountObject);
}

else {
    chrome.storage.local.get('expungevt', function (result) {
        console.log(result.expungevt)
        
        var oldName = result.expungevt["defName"];
        var newName = petitionerCountObject["defName"];
        var nameAnswer = true;
        if (oldName != newName) {
            nameAnswer = confirm("The name on the counts you are trying to add is " +
                newName +
                ", which is not the same as " +
                oldName +
                ". Are you sure you want to continue?");
        }
        if (oldName == newName || nameAnswer == true) {
            let totalMatchCount = 0;
            for (let i = 0; i < petitionerCountObject["counts"].length; i++) {
                let matchCount = 0;

                for (let j = 0; j < result.expungevt["counts"].length; j++) {
                    if (result.expungevt["counts"][j].uid == petitionerCountObject["counts"][i].uid) {
                        matchCount++;
                        totalMatchCount++;
                    }
                }
                if (matchCount == 0) {
                    result.expungevt["counts"].push(petitionerCountObject["counts"][i]);
                }

            }
            if (totalMatchCount > 0) {
                alert(totalMatchCount + " counts matched existing counts and were not added.")
            }
            chrome.storage.local.set({
                expungevt: result.expungevt
            });
            chrome.runtime.sendMessage(result.expungevt);
        }
        })
    }

function getPetitionerInfo() {

    //Get Defendant Name
    nameLocation = nthIndex(docketBody, "Defendant:", 1) + 15
    nameLocationEnd = nthIndex(docketBody, "DOB:", 1) - 40
    defName = docketBody.substring(nameLocation, nameLocationEnd)

    //Get Date of Birth
    dobLocation = nthIndex(docketBody, "DOB:", 1) + 15
    dobLocationEnd = nthIndex(docketBody, "POB:", 1) - 40
    defDOB = docketBody.substring(dobLocation, dobLocationEnd)

    //Get Address
    try {
        //match all between address and next hearing
        addressString = docketBody.match(/(?<=Address:)\s+.*(?=Next Hearing:)/gms)
        addressArray = addressString[0].split("\n")
        addressArray.pop()
        //trims off disposed text and excess spaces
        addressArray[1] = addressArray[1].match(/([ \t]{6,})(.*)/gms).toString()
    }
    catch {
        addressArray = []
        addressArray[0] = "No Address found"
    }
    for (i = 0; i < addressArray.length; i++) {
        addressArray[i] = addressArray[i].trim()
    }

    //get docket Num
    docketSheetNum = docketBody.match(/([Docket No.\s+])(\d.*?cr)/)[0].trim()

    //create all counts object
    tempPetitionerCountObject = {
        "defName": defName,
        "defDOB": defDOB,
        "defAddress": addressArray,
        "counts": [],
    }

    return tempPetitionerCountObject;
}

function getCountInfo(tempPetitionerCountObject) {

    //Determine Number of Counts and create array with each line count
    countsStart = nthIndex(docketBody, divider, 2) + divider.length + 1
    countsEnd = docketBody.substring(countsStart).indexOf("=") + countsStart
    allCountsBody = docketBody.substring(countsStart, countsEnd)
    countTotal = (allCountsBody.match(/\n/g) || []).length / 2;
    countTotal = Math.ceil(countTotal)
    allCountsArray = allCountsBody.split("\n")

    //Move data from count table into objects
    countLines = countTotal * 2

    for (i = 0; i < countLines; i++) {
        //Catch Line 1 (odd lines) of each count
        if ((i + 1) % 2 != 0) {
            countObject = {};
            processCountLine1(allCountsArray[i], i / 2)
        } else { //Catch Line 2 of each count
            description = allCountsArray[i].trim()
            console.log("description: "+description)
            description = description.replace(/\//g, " / ")
            description = description.replace(/\s\s/g, " ")
            countObject["description"] = description

            tempPetitionerCountObject.counts.push(countObject)
        }
    }

    return tempPetitionerCountObject

}


function isSurchageDue() {

    //if a surchage is entered in the record there is at least one def-pay section
    //if the surchage was due and has been paid, there is a finpay section.
    //if there is a defpay record and no fin pay record, then a surchage is due.
    //if there is no defpay and no finpay, then no surchage is due.

    var isSurchageDue = (surchargeCreated() && !finalPayment())

    return isSurchageDue;

    function surchargeCreated() {
        return docketBody.includes("defpay") || docketBody.includes("surcharge assessed") || docketBody.includes("Referred to collection agency") || docketBody.includes("referred to collection agency");;

    }
    function finalPayment() {
        return docketBody.includes("finpay") || docketBody.includes("paid in full")
    }
}

//Break line one of a count into its individual fields
function processCountLine1(countLine1, countNum) {
    //Break into array and remove spaces
    countLine1Array = countLine1.split(" ")
    countLine1Array = countLine1Array.filter(function (el) {
        return el != "";
    });

    //find location of fel/mis
    felMisLocation = countLine1Array.findIndex(isFelOrMisd);

    function isFelOrMisd(element) {
        if (element === "mis") {
            return element = "mis"
        };
        if (element === "fel") {
            return element = "fel"
        };

    }

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
        "county": getCounty(countLine1Array[2]),
        "titleNum": countLine1Array[4],
        "sectionNum": offenseSection,
        "offenseClass": countLine1Array[felMisLocation],
        "dispositionDate": countLine1Array[felMisLocation + 1],
        "offenseDisposition": checkDisposition(disposition),
        "filingType": "",
        "docketSheetNum": docketSheetNum,
        "outstandingPayment": isSurchageDue()
    }

    function checkDisposition() {
        disposition = disposition.trim()
        if (disposition == "") {
            return "pending"
        } else {
            return disposition
        }
    }

    //Get Alleged offense date:
    try {
        offenseDateArray = docketBody.match(/Alleged\s+offense\s+date:\s+(\d\d\/\d\d\/\d\d)/gi)
        offenseDateString = offenseDateArray[countNum];
        offenseDateLocation = offenseDateString.length;
        offenseDateLocationEnd = offenseDateLocation - 8
        allegedOffenseDate = offenseDateString.substring(offenseDateLocation, offenseDateLocationEnd);
        countObject["allegedOffenseDate"] = allegedOffenseDate.trim();
    }
    catch (err) {
        countObject["allegedOffenseDate"] = "Check Docket";
        console.log("Error:" + err);
    }

    //Get Arrest/citation date:
    try {
        arrestDateArray = docketBody.match(/Arrest\/Citation\s+date:\s+(\d\d\/\d\d\/\d\d)/gi);
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

function getCounty(countyCode) {
    code = countyCode.substring(0, 2).trim()
    vtCounties = [{
        "An": "Addison",
        "Bn": "Bennington",
        "Ca": "Caledonia",
        "Cn": "Chittenden",
        "Ex": "Essex",
        "Fr": "Franklin",
        "Gi": "Grand Isle",
        "Le": "Lamoille",
        "Oe": "Orange",
        "Os": "Orleans",
        "Rd": "Rutland",
        "Wn": "Washington",
        "Wm": "Windham",
        "Wr": "Windsor"
    }]
    return vtCounties[0][code]
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