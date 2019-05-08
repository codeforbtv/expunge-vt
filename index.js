const express = require('express');
const path = require('path');

const app = express();

app.use('/', express.static(path.resolve(__dirname, 'formMenu/')));

app.use('/iframe', express.static(path.resolve(__dirname, 'iframe/')));

app.listen(3000);

console.log('ExpungeVT form served at localhost:3000 \n ...iframe served at localhost:3000/iframe (for now)');
