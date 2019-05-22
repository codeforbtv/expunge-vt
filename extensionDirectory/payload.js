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

infoStateLocation = nthIndex(docketBody, divider, 2) + divider.length
infoStateLocationEnd = nthIndex(docketBody, divider, 3)

docketInfo = docketBody.substring(infoStateLocation, infoStateLocationEnd)

docketArray = docketInfo.split(" ")

docketArray = docketArray.filter(function (el) {
    return el != "";
});


offenseStatus = ""
offenseDesc = ""

carriage = /\n/;

currentData = "status"
carriageCount = 0

////For Loop Processes Offense Status and Description
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
    "docket": docketArray[1] + " " + docketArray[2],
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
