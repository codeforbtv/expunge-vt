console.log('Init');

chrome.storage.onChanged.addListener(function(changes, namespace) {
  var storageChange = changes['expungevt'];
  console.log('Chrome storage (namespace "%s") had a value change on key expungevt.\n\n' +
              'Old value:  "%s"\n\n' +
              'New value:  "%s"\n\n',
              namespace,
              JSON.stringify(storageChange.oldValue),
              JSON.stringify(storageChange.newValue));

  document.getElementById('destination').innerHTML = JSON.stringify(storageChange.newValue);
});
