console.log('Init');

window.onmessage = function(event) {
  console.log('received message: ', event.data)
  document.getElementById('destination').innerHTML = event.data;
}

var iframe = document.getElementById('iframe').contentWindow;
