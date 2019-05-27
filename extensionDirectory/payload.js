// send the page title as a chrome message
docketBody = document.getElementsByTagName("pre")[0].innerHTML

divider = "================================================================================"

//Get Defendant Name
nameLocation = nthIndex(docketBody, "Defendant:", 1) + 15
nameLocationEnd = nthIndex(docketBody, "DOB:", 1) - 40
defName = docketBody.substring(nameLocation, nameLocationEnd)

//Get Date of Birth
dobLocation = nthIndex(docketBody, "DOB:", 1) + 15
dobLocationEnd = nthIndex(docketBody, "POB:", 1) - 40
defDOB = docketBody.substring(dobLocation, dobLocationEnd)


//Determine Number of Counts and create array with each line count
countsStart = nthIndex(docketBody, divider, 2) + divider.length + 1
countsEnd = nthIndex(docketBody, divider, 3)
allCountsBody = docketBody.substring(countsStart, countsEnd)
countTotal = (allCountsBody.match(/\n/g) || []).length / 2;
allCountsArray = allCountsBody.split("\n")

//create all counts object
allCountsObject = [{
    "defName": defName,
    "defDOB": defDOB,
    "totalCounts": countTotal,
    "counts": []
}]


//Move data from count table into objects
countLines = countTotal*2
for (i = 0; i < countLines; i++) {
    //Catch Line 1 (odd lines) of each count
    if ((i + 1) % 2 != 0) {
        countObject = [{}];
        processCountLine1(allCountsArray[i])
    }
    else {   //Catch Line 2 of each count
        description = allCountsArray[i].trim()
        countObject[0]["description"] = description

        allCountsObject[0].counts.push(countObject[0])
    }
}

//Break line one of a count into its individual fields
function processCountLine1(countLine1) {

    //Break into array and remove spaces
    countLine1Array = countLine1.split(" ")
    countLine1Array = countLine1Array.filter(function (el) {
        return el != "";
    });

    //find location of fel/mis
    felMisLocation = countLine1Array.findIndex(isFelOrMisd);
    function isFelOrMisd(element) {
        if (element === "mis") {return element = "mis"};
        if (element === "fel") {return element = "fel"};

    }

    //get section string(s)
    for (j = 5; j < felMisLocation; j++) {
        if (j === 5) {
            offenseSection = countLine1Array[j]
        }
        else {
            offenseSection = offenseSection + " " + countLine1Array[j]
        }
    }

    // get disposition string
    disposition = ""
    for (j = (felMisLocation+2); j < countLine1Array.length; j++) {
        if (j === 8) {
            disposition = countLine1Array[j]
        }
        else {
            disposition = disposition + " " + countLine1Array[j]
        }
    }

    //Create count object with all count line 1 items
    balls = ["left", "right"]
    countObject = [{
        "countNum": countLine1Array[0],
        "docketNum": countLine1Array[1],
        "docketCounty": countLine1Array[2],
        "titleNum": countLine1Array[4],
        "sectionNum": offenseSection,
        "offenseClass": countLine1Array[felMisLocation],
        "dispositionDate": countLine1Array[felMisLocation+1],
        "offenseDisposition": disposition.trim(),
    }]
    
    //Get Alleged offense date:
    offenseDateArray = docketBody.match(/Alleged\s+offense\s+date:\s(\d\d\/\d\d\/\d\d)/gi)
    offenseDateString = offenseDateArray[countObject[0].countNum-1]
    offenseDateLocation = offenseDateString.length
    offenseDateLocationEnd = offenseDateLocation - 8
    allegedOffenseDate = offenseDateString.substring(offenseDateLocation, offenseDateLocationEnd)
    countObject[0]["allegedOffenseDate"] = allegedOffenseDate.trim() 

    //Get Arrest/citation date:
    offenseDateArray = docketBody.match(/Arrest\/Citation\s+date:\s(\d\d\/\d\d\/\d\d)/gi)
    offenseDateString = offenseDateArray[countObject[0].countNum-1]
    offenseDateLocation = offenseDateString.length
    offenseDateLocationEnd = offenseDateLocation - 8
    arrestCitationDate = offenseDateString.substring(offenseDateLocation, offenseDateLocationEnd)
    countObject[0]["arrestCitationDate"] = arrestCitationDate.trim()
}


localStorage.setItem('allCounts', JSON.stringify(allCountsObject))
chrome.runtime.sendMessage(allCountsObject);

chrome.storage.local.set({
    expungevt: allCountsObject
});


function nthIndex(str, subStr, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(subStr, i);
        if (i < 0) break;
    }
    return i;
}