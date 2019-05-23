// send the page title as a chrome message
docketBody = document.getElementsByTagName("pre")[0].innerHTML

divider = "================================================================================"

//Get Defendant Name
nameLocation = nthIndex(docketBody, "Defendant:", 1)+15
nameLocationEnd = nthIndex(docketBody, "DOB:", 1)-40
defName = docketBody.substring(nameLocation,nameLocationEnd)

//Get Date of Birth
dobLocation = nthIndex(docketBody, "DOB:", 1)+15
dobLocationEnd = nthIndex(docketBody, "POB:", 1)-40
defDOB = docketBody.substring(dobLocation,dobLocationEnd)

//Determine Number of Counts
countsStart = nthIndex(docketBody, divider, 2) + divider.length+1
countsEnd = nthIndex(docketBody, divider, 3)
allCountsBody = docketBody.substring(countsStart, countsEnd)
countTotal = (allCountsBody.match(/\n/g) || []).length/2;
allCountsArray = allCountsBody.split("\n")

console.log({allCountsBody})
console.log({allCountsArray})
for (i = 0; i <= count; i++){
allcountArray[i]
}

//Get string for entire count
countInfoLocation = nthIndex(docketBody, divider, 2) + divider.length
countInfoLocationEnd = nthIndex(docketBody, divider, 3)

docketInfo = docketBody.substring(countInfoLocation, countInfoLocationEnd)

docketArray = docketInfo.split(" ")

docketArray = docketArray.filter(function (el) {
    return el != "";
});


offenseStatus = ""
offenseDesc = ""

carriage = /\n/;

currentData = "status"
carriageCount = 0

////Extract Offense Status and Description
for (let i = 8; i < docketArray.length && carriageCount < 2; i++) {

    if (currentData === "status") {
        if (i == 7) {
            offenseStatus = docketArray[i]
        } else {
            offenseStatus += " " + docketArray[i]
        }
    } else {
        if (offenseDesc == "") {
            offenseDesc = docketArray[i]
        } else {
            offenseDesc += " " + docketArray[i]
        }
    }

    if (docketArray[i].match(carriage) != null) {
        currentData = "description"
        carriageCount +=1
    }

}


offenseStatus = offenseStatus.substring(0,offenseStatus.indexOf("\n", 1))
offenseDesc = offenseDesc.substring(0,offenseDesc.indexOf("\n", 1))

counts = []

counts = [{
    "defName": defName,
    "defDOB": defDOB,
    "countNum": docketArray[3],
    "docket": docketArray[1],
    "countyCode": docketArray[2],
    "offenseTitle": docketArray[4],
    "offenseSection": docketArray[5],
    "fmo": docketArray[6],
    "date": docketArray[7],
    "offenseStatus": offenseStatus,
    "offenseDesc": offenseDesc,
}]

localStorage.setItem('counts', JSON.stringify(counts))
chrome.runtime.sendMessage(counts);

chrome.storage.local.set({ expungevt: counts });


function nthIndex(str, subStr, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(subStr, i);
        if (i < 0) break;
    }
    return i;
}
