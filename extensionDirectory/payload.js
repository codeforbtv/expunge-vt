// send the page title as a chrome message
docketBody = document.getElementsByTagName("pre")[0].innerHTML

divider = "================================================================================"


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
offenseStatus = offenseStatus.replace(/\n/, '')
offenseDesc = offenseDesc.replace(/\n/, '')
counts = []

counts = [{
    "countNum": docketArray[3],
    "docket": docketArray[1] + " " + docketArray[2],
    "offenseTitle": docketArray[4],
    "offenseSection": docketArray[5],
    "fmo": docketArray[6],
    "date": docketArray[7],
    "offenseStatus": offenseStatus,
    "offenseDesc": offenseDesc,
}]


chrome.runtime.sendMessage(counts);





function nthIndex(str, subStr, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(subStr, i);
        if (i < 0) break;
    }
    return i;
}