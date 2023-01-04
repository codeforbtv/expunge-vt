# Expunge-VT

This project originated as a way for Vermont Legal Aid (VLA) to generate petitions more quickly during their expungement clinics.

VLA runs free clinics throughout the year, but copying information off state databases and filling out petitions by hand is slow. By creating a chrome extension that generates printable files at the push of a button, volunteer attorneys help more people clear their records in every clinic.

# The Chrome extension

[<img src="https://uploads-ssl.webflow.com/5f4f5872323e026126988212/5f56321f2220c927ad18423e_ChromeWebStore_BadgeWBorder_v2_496x150.png" width=300/>](https://chrome.google.com/webstore/detail/expungevt/kkooclhchngcejjphmbafbkkpnaimadn)

Printable petitions are generated using an extension for the Chrome browser.

The extension essentially reads and (temporarily remembers) info as an attorney browses through case records. This information is automatically inserted into the specified petitions and a printable webpage is generated. The attorney can correct common data errors, insert petitioner names/dates/etc, and print petitions for submission to the state's attorneys.

Petitions are separated by county, and (optionally) by docket or case, making it easier to submit petitions in the format preferred by each county.

## What does it do?

- **It does** generate petitions 50-80% faster than doing them by hand.
- **It does** parse criminal dockets for all available info.
- **It does** collect data from multiple cases across multiple counties.
- **It does** generate petitions that can be edited and printed.
- **It does** highlight some useful case info (misdemeanors, dismissals, fees, etc).

But equally important are the things it **does not** do:

- **It does not** replace a qualified attorney.
- **It does not** grant anyone access to criminal record data.
- **It does not** work outside Vermont... yet!

## Who can use Expunge-VT?

This tool was originally developed exclusively for use by VLA in their clincs in 2018. But as volunteer attorneys use the tool in clincs, they have started using it in their own practices as well.

- **Anyone with data access...** The extension can only be used by people who already have access to state criminal databases - the extension does not grant any data access itself. But the extension will work for anyone who has access to criminal dockets through [VT Courts Online](https://secure.vermont.gov/vtcdas/user) or [Vermont Judiciary Public Portal](https://publicportal.courts.vt.gov/Portal).

- **... but primarily attorneys.** Although anyone with data access can use this tool to generate petitions, they will need to be reviewed (and possibly corrected or modified) by an attorney familiar with expungement statutues. There are a lot of intracasies in expunging & sealing records and conflicts and inaccuracies in the official records that require expert review.

## Demo Expunge-VT

Although you can't generate real petitions without data access, you can give it a test run on this sample docket. Just download [the extension from the Chrome Store](https://chrome.google.com/webstore/detail/expungevt/kkooclhchngcejjphmbafbkkpnaimadn), navigate to one of these three pages, and click the icon to begin parsing the dockets.

1. [Sample Docket](http://htmlpreview.github.io/?https://github.com/codeforbtv/expunge-vt/blob/master/sampleDocketHTML/sample1.html)

You can also view our working draft of [user documentation here](https://docs.google.com/document/d/1tsb6ATu75B6rkEfKKBy32mENy5KHYtM-_wrg36Plc50/edit?usp=sharing).

## Setup for local development - Manifest 3

If you are a programmer and are interested in how the extension works, it's easy to run locally too. For more information on how you can pitch in (because that would be super helpful) visit the `#expunge-vt` channel in [Code for BTV's Slack](http://cfbtv-slackin.herokuapp.com/).

1. Clone the github repo, navigate to the `extensionDirectory` folder and run "npm install".

1. Open [chrome://extensions/](chrome://extensions/) on your chrome browser.

1. Use NVM install or similar app to ensure you are using node 19.2.0.

1. cd into extension directory, and run the following:
   - npm install
   - npm run build

1. Ensure "Developer mode" is switched on in the top right of the screen.

1. Select `Load unpacked` from the top left, and select the `extensionDirectory/build` folder from the project folder.

1. Open a sample html docket from the "sampleDocketHTML" folder.

1. While viewing the sample docket page, click the chrome extension icon to begin using the exention.

1. Familiarlize yourself with [how chrome extensions work](./README_EXTENSIONS_OVERVIEW.md).

## Contact Us

This tool was created by Code for BTV, in partnership with [Vermont Legal Aid](https://www.vtlegalaid.org/).

Please send questions, comments, or feedback to expungevt@codeforbtv.org
