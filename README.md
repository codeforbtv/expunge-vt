# Expunge-VT

This project attempts to help VLA clear records more quickly during their expungment clinics.

A criminal record can interfere with getting a job, housing, food assistance and other aspects of life. Many records are decades old and are eligible to be removed, but the process generally requires the help of an attourney.

Our partner Vermont Legal Aid holds periodic clinics where attourneys volunteer their time to help clear eligible records for vermonters, but it is a very manual process. These clinics generally have a waitlist of Vermonters who cannot be processed.

This project is a chrome extension that let's attourneys generate printable forms rather than copy them from the web by hand. This could bring the time it takes to clear someone's record from ~90 min to around 20 min -
**...potentially doubling or trippling the number of clients VLA can serve.**

# The Chrome extension

[View Extension](https://chrome.google.com/webstore/detail/expungevt/kkooclhchngcejjphmbafbkkpnaimadn){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }

This project works through a chrome extension that reads an HTML docket sheet from [VT Courts Online](https://secure.vermont.gov/vtcdas/user) that provides key data a defendant's case. One or more cleaned samples of an HTML docket can be found in the "sampleDocketHTML" folder. When the project is complete, the extension will use the data parsed from the HTML to print petitions for expungement ready for filing.

## Requirements for using this extension

- This tool is designed exclusively for VT Legal Aid.
- Users must have an active subscription with [VT Courts Online](https://secure.vermont.gov/vtcdas/user).
- This tool does not save or expand access to any data captured from court records.

## Setup for local development

1. Clone the github repository to your machine

1. In your terminal, navigate to the `extensionDirectory` folder and run "npm install".

1. Open [chrome://extensions/](chrome://extensions/) on your chrome browser.

1. Ensure "Developer mode" is switched on in the top right of the screen.

1. Select `Load unpacked` from the top left, and select the `extensionDirectory` folder from the project folder.

1. Open a sample html docket from the "sampleDocketHTML" folder.

1. While viewing the sample docket page, click the chrome extension icon to begin using the exention.

1. Familiarlize yourself with [how chrome extensions work](./README_EXTENSIONS_OVERVIEW.md).

## Usage instructions

See a working draft of user documentation here: https://docs.google.com/document/d/1tsb6ATu75B6rkEfKKBy32mENy5KHYtM-_wrg36Plc50/edit?usp=sharing
