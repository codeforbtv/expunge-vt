'use strict';

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostContains: ''},
      }),
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostContains: 'secure.vermont.gov'},
      }),
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {urlContains: 'chrome-extension://'},
      })
    ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.clear()
 })