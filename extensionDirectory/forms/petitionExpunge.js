document.addEventListener("DOMContentLoaded", function () {
    getData();
}, false);

function getData() {
    chrome.storage.local.get(['expungevt'], function (result) {
        setFormData(result.expungevt[0])
    });
}

function setFormData(allCounts) {

    urlCount = window.location.href.split("?")[1]
    console.log(allCounts)
    document.getElementById('petitionerName').innerHTML = allCounts.defName + ",";
    document.getElementById('courtCounty').innerHTML = allCounts.counts[0].county;

    // document.getElementById('docketNumHeader').innerHTML = allCounts.counts[urlCount - 1].docketNum + " " + allCounts.counts[urlCount - 1].docketCounty;

    //add multiple docket numbers
    docketArray = []
    for (i = 0; i < allCounts.counts.length; i++) {
        count = allCounts.counts[i];
        docketArray.push(count.docketNum)
    }

    var unique = docketArray.filter((v, i, a) => a.indexOf(v) === i); 

    for (i = 0; i < unique.length; i++) {
        $('#docketNumHeader').append(`<p contenteditable="true">${unique[i]} ${allCounts.counts[0].docketCounty}<p>`);
    }


    //populate table with convictions and dates
    setConvictionDate(allCounts)


    //Adjust text to singular where there is only one count
    if (allCounts.counts.length === 1) {
        document.getElementById('introParagraph').innerHTML = "Petitioner moves the Court to expunge the record of the above-captioned conviction pursuant to 13 V.S.A. § 7602."

        document.getElementById('paragraph1').innerHTML = "1. I was convicted of the following crime:"

        document.getElementById('paragraph2').innerHTML = "2. This is a qualifying crime pursuant to 13 V.S.A. &sect 7601(4)."

        document.getElementById('paragraph3').innerHTML = "3. Expunging all record of this conviction is in the interest of justice because:"
    }

    //set petitioner name and address at signature section
    $('#petitionerAddress').append(`<p contenteditable="true">${allCounts.defName}, Petitioner<p>`);
    for (i=0; i< allCounts.defAddress.length; i++) {
        $('#petitionerAddress').append(`<p contenteditable="true">${allCounts.defAddress[i]}<p>`);
    }

}

function setConvictionDate(allCounts) {
    $('#convictionTableBody').empty();
    for (i = 0; i < allCounts.totalCounts; i++) {
        count = allCounts.counts[i];
        $('#convictionTableBody').append(`<tr><td>${count.dispositionDate}</td><td>${count.description.toLowerCase()}</td></tr>`);
    }
}