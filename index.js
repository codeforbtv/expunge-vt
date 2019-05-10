const fs = require('fs');
const open = require('open');
require('log-timestamp');

const extensionDirectory = './extensionDirectory';

console.log(`Watching for file changes in ${extensionDirectory}`);

fs.watch(extensionDirectory, function(event, filename) {
  if (filename) {
    console.log(`${filename} file changed`);
    open('http://reload.extensions/', {app: ['google-chrome']})
    }
  }
})
