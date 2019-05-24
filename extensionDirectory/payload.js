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

    countLine1Array = countLine1.split(" ")

    countLine1Array = countLine1Array.filter(function (el) {
        return el != "";
    });

    disposition = ""
    for (j = 8; j < countLine1Array.length; j++) {
        if (j === 8) {
            disposition = countLine1Array[j]
        }
        // if  (i === (countLine1Array.length -1)) {
        //     disposition = disposition + s + countLine1Array[i]
        // }
        else {
            disposition = disposition + " " + countLine1Array[j]
        }

    }

    countObject = [{
        "countNum": countLine1Array[0],
        "docketNum": countLine1Array[1],
        "docketCounty": countLine1Array[2],
        "titleNum": countLine1Array[4],
        "sectionNum": countLine1Array[5],
        "offenseClass": countLine1Array[6],
        "dispositionDate": countLine1Array[7],
        "offenseDisposition": disposition,
    }]

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