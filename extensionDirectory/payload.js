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
    chrome.storage.local.get(['expungevt'], function (result) {

        for (i = 0; i < petitionerCountObject[0]["counts"].length; i++) {
            result.expungevt[0]["counts"].push(petitionerCountObject[0]["counts"][i])
            result.expungevt[0]["totalCounts"] += 1
        }
        chrome.storage.local.set({
            expungevt: result.expungevt
        });
        chrome.runtime.sendMessage(result.expungevt);

    });

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
    addressString = docketBody.match(/(?<=Address:)\s+.*(?=Next Hearing:)/gms)
    addressArray = addressString[0].split("\n")
    addressArray.pop()
    addressArray[1] = addressArray[1].match(/([ \t]{6,})(.*)/gms).toString()
    for (i = 0; i < addressArray.length; i++) {
        addressArray[i] = addressArray[i].trim()
    }

    //get docket Num
    docketSheetNum = docketBody.match(/(?<=\|  Docket No.  ).*(?=\s\s)/gm)[0].trim()

    //create all counts object
    tempPetitionerCountObject = [{
        "defName": defName,
        "defDOB": defDOB,
        "defAddress": addressArray,
        "counts": [],
    }]

    return tempPetitionerCountObject;
}

function getCountInfo(tempPetitionerCountObject) {

    //Determine Number of Counts and create array with each line count
    countsStart = nthIndex(docketBody, divider, 2) + divider.length + 1
    countsEnd = nthIndex(docketBody, divider, 3)
    allCountsBody = docketBody.substring(countsStart, countsEnd)
    countTotal = (allCountsBody.match(/\n/g) || []).length / 2;
    tempPetitionerCountObject[0]["totalCounts"] = countTotal;
    allCountsArray = allCountsBody.split("\n")

    //Move data from count table into objects
    countLines = countTotal * 2

    for (i = 0; i < countLines; i++) {
        //Catch Line 1 (odd lines) of each count
        if ((i + 1) % 2 != 0) {
            countObject = [{}];
            processCountLine1(allCountsArray[i], i/2)
        } else { //Catch Line 2 of each count
            description = allCountsArray[i].trim()
            description = description.replace(/\//g, " / ")
            description = description.replace(/\s\s/g, " ")
            countObject[0]["description"] = description

            tempPetitionerCountObject[0].counts.push(countObject[0])
         }
    }

    return tempPetitionerCountObject

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

    //Create count object with all count line 1 items
    countObject = [{
        "countNum": countLine1Array[0],
        "docketNum": countLine1Array[1],
        "docketCounty": countLine1Array[2],
        "county": getCounty(countLine1Array[2]),
        "titleNum": countLine1Array[4],
        "sectionNum": offenseSection,
        "offenseClass": countLine1Array[felMisLocation],
        "dispositionDate": countLine1Array[felMisLocation + 1],
        "offenseDisposition": checkDisposition(disposition),
        "filingType": "X",
        "docketSheetNum": docketSheetNum,
    }]

    function checkDisposition(){
        disposition = disposition.trim()
        if (disposition == "") {
            return "pending"
        } else {
            return disposition
        }
    }

    //Get Alleged offense date:
    offenseDateArray = docketBody.match(/Alleged\s+offense\s+date:\s+(\d\d\/\d\d\/\d\d)/gi)
    offenseDateString = offenseDateArray[countNum]
    offenseDateLocation = offenseDateString.length
    offenseDateLocationEnd = offenseDateLocation - 8
    allegedOffenseDate = offenseDateString.substring(offenseDateLocation, offenseDateLocationEnd)
    countObject[0]["allegedOffenseDate"] = allegedOffenseDate.trim()

    //Get Arrest/citation date:
    arrestDateArray = docketBody.match(/Arrest\/Citation\s+date:\s+(\d\d\/\d\d\/\d\d)/gi)
    arrestDateString = arrestDateArray[countNum]
    arrestDateLocation = arrestDateString.length
    arrestDateLocationEnd = arrestDateLocation - 8
    arrestCitationDate = arrestDateString.substring(arrestDateLocation, arrestDateLocationEnd)
    countObject[0]["arrestCitationDate"] = arrestCitationDate.trim()
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