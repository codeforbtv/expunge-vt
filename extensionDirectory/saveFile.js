import dayjs from 'dayjs';

function saveAllCountsToHtml(savedData) {
  
  if (savedData == null || !savedData.length) {
    alert('No case data available to save.');
    return null;
  }
  let allData = JSON.parse(savedData)
  let defName = allData.saved.defName.split(" ")
  let defInitials = ""
  defName.forEach((n) => {
    defInitials += n[0]
  })

  let now = dayjs().format('YYYY-MM-DD');
  let obfuscatedSavedData = Base64.encode(savedData);
  let fileName = now + '-' + defInitials;
  let htmlString = `
  <html>
    <head>
      <title>ExpungeVT Case Record</title>
    </head>
    <body>
      <div class="container">
        <img src="https://avatars.githubusercontent.com/u/3893216?s=200&v=4"/>
        <h1><u>ExpungeVT Case File:</u> <span class="file-name">${fileName}</span></h1>
        <div class="instruct-box">
          <h2>Follow these steps to load your case file:</h2>
          <ol>
          <li>If you do not have the expungeVT chrome extension, <a target="_blank" href="https://chrome.google.com/webstore/detail/expungevt/kkooclhchngcejjphmbafbkkpnaimadn?hl=en&authuser=0">download it here</a> using a chrome browser.</li>
          <li>Click the extension icon, and then click "Clear All"</li>
          <li>Click the extension icon again, and while viewing this page, click "Load Case File"</li>
          </ol>
          <div class="i-wrapper">
              <i class="far fa-save"></i>
          </div>
        </div>
        <p id="roa-content" class="case-data">${obfuscatedSavedData}</p>
      </div>
    </body>

    <style>
      .container {
        max-width: 900px;
        padding: 25px 10px 25px 10px;
        margin: auto;
        word-wrap: break-word;
        border-bottom: solid 2px #004085;
      }

      .i-wrapper {
        width: 100%;
        text-align: center;
      }

      i {
        font-size: 100px;
        margin: auto;
      }

      .case-data {
        display: none;
      }

      .file-name {
        padding: 10px;
        color: #004085;
        background-color: #cce5ff;
      }

      .instruct-box {
        max-width: 500px;
        padding: 10px;
        color: #004085;
        margin: auto;
        background-color: #cce5ff;
      }

      li {
        font-size: 16px;
      }

      img {
        width: 100px;
      }
    </style>

    <script id="script">
    </script>
    <script src="https://kit.fontawesome.com/ac322eed98.js" crossorigin="anonymous"></script>
  </html>`;

  var blob = new Blob([htmlString], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: fileName + '.html',
  });
}

var Base64 = {
  _keyStr:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef' + 'ghijklmnopqrstuvwxyz0123456789+/=',
  encode: function (e) {
    var t = '';
    var n, r, i, s, o, u, a;
    var f = 0;
    e = Base64._utf8_encode(e);
    while (f < e.length) {
      n = e.charCodeAt(f++);
      r = e.charCodeAt(f++);
      i = e.charCodeAt(f++);
      s = n >> 2;
      o = ((n & 3) << 4) | (r >> 4);
      u = ((r & 15) << 2) | (i >> 6);
      a = i & 63;
      if (isNaN(r)) {
        u = a = 64;
      } else if (isNaN(i)) {
        a = 64;
      }
      t =
        t +
        this._keyStr.charAt(s) +
        this._keyStr.charAt(o) +
        this._keyStr.charAt(u) +
        this._keyStr.charAt(a);
    }
    return t;
  },
  decode: function (e) {
    var t = '';
    var n, r, i;
    var s, o, u, a;
    var f = 0;
    e = e.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    while (f < e.length) {
      s = this._keyStr.indexOf(e.charAt(f++));
      o = this._keyStr.indexOf(e.charAt(f++));
      u = this._keyStr.indexOf(e.charAt(f++));
      a = this._keyStr.indexOf(e.charAt(f++));
      n = (s << 2) | (o >> 4);
      r = ((o & 15) << 4) | (u >> 2);
      i = ((u & 3) << 6) | a;
      t = t + String.fromCharCode(n);
      if (u != 64) {
        t = t + String.fromCharCode(r);
      }
      if (a != 64) {
        t = t + String.fromCharCode(i);
      }
    }
    t = Base64._utf8_decode(t);
    return t;
  },
  _utf8_encode: function (e) {
    e = e.replace(/\r\n/g, '\n');
    var t = '';
    for (var n = 0; n < e.length; n++) {
      var r = e.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
      } else if (r > 127 && r < 2048) {
        t += String.fromCharCode((r >> 6) | 192);
        t += String.fromCharCode((r & 63) | 128);
      } else {
        t += String.fromCharCode((r >> 12) | 224);
        t += String.fromCharCode(((r >> 6) & 63) | 128);
        t += String.fromCharCode((r & 63) | 128);
      }
    }
    return t;
  },
  _utf8_decode: function (e) {
    var t = '';
    var n = 0;
    var r = (c1 = c2 = 0);
    while (n < e.length) {
      r = e.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
        n++;
      } else if (r > 191 && r < 224) {
        c2 = e.charCodeAt(n + 1);
        t += String.fromCharCode(((r & 31) << 6) | (c2 & 63));
        n += 2;
      } else {
        c2 = e.charCodeAt(n + 1);
        c3 = e.charCodeAt(n + 2);
        t += String.fromCharCode(
          ((r & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
        );
        n += 3;
      }
    }
    return t;
  },
};

export default saveAllCountsToHtml