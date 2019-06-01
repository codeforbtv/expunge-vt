document.addEventListener("DOMContentLoaded", function () {
    getData();
}, false);

function getData() {
    chrome.storage.local.get(['expungevt'], function (result) {
        setFormData(result.expungevt[0])
    });
}

function setFormData(allCounts){

    urlCount = window.location.href.split("?")[1].split("/")[1]
    console.log(allCounts)

    document.getElementById('courtCounty').innerHTML = allCounts.counts[urlCount-1].county;
    document.getElementById('docketNumHeader').innerHTML = allCounts.counts[urlCount-1].docketNum + " " + allCounts.counts[urlCount-1].docketCounty;
    document.getElementById('petitionerName').innerHTML = allCounts.defName;
    document.getElementById('description').innerHTML = allCounts.counts[urlCount-1].description;
    document.getElementById('dispoDate').innerHTML = allCounts.counts[urlCount-1].dispositionDate;

}

