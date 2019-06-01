console.log('Init');

chrome.storage.onChanged.addListener(function(changes, namespace) {
  var storageChange = changes['expungevt'];
  console.log('Chrome storage (namespace "%s") had a value change on key expungevt.\n\n' +
              'Old value:  "%s"\n\n' +
              'New value:  "%s"\n\n',
              namespace,
              JSON.stringify(storageChange.oldValue),
              JSON.stringify(storageChange.newValue));

  // document.getElementById('destination').innerHTML = JSON.stringify(storageChange.newValue);
});


document.addEventListener("DOMContentLoaded", function () {
  getData();
}, false);

function getData() {
  chrome.storage.local.get(['expungevt'], function (result) {
      console.log(result.expungevt[0]);
      setFormData(result.expungevt[0])
  });
}


function setFormData(allCounts){
}