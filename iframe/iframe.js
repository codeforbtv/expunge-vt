console.log('Init')

var storedTest = localStorage.getItem('message');

console.log('storedTest ', storedTest);

window.parent.postMessage(storedTest, "*");

window.onmessage = function (event) {
  console.log('received message:' , event.data);
  localStorage.setItem('message', event.data);
  document.getElementById('results').innerHTML = event.data;
}

// window.onstorage = function(e) {
//  console.log('onstorage');
//  window.parent.postMessage(storedTest);
// };
