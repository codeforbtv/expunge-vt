// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            // Allow opening popup on all. Domains below available if this is turned off.
            pageUrl: { hostContains: '' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            // Code for BTV has demo dockets for practicing
            pageUrl: { hostContains: 'codeforbtv.org' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            // VT Courts Online (VCOL)
            pageUrl: { hostContains: 'secure.vermont.gov' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            // Odyssey site
            pageUrl: { hostContains: 'publicportal.courts.vt.gov' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            // Odyssey logout confirmation page
            pageUrl: { hostContains: 'odysseyidentityprovider.tylerhost.net' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: 'chrome-extension://' },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            // Activate extention on new tabs (helpful for navigating to VCOL and Odyssey)
            pageUrl: { urlContains: 'chrome://newtab/' },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

chrome.runtime.onStartup.addListener(function () {
  chrome.storage.local.clear();
});
