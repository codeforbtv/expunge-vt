# Expunge-VT

This project attempts to help VLA clear records more quickly during their expungment clinics.

A criminal record can interfere with getting a job, housing, food assistance and other aspects of life. Many records are decades old and are eligible to be removed, but the process generally requires the help of an attorney.

Our partner, Vermont Legal Aid, holds periodic clinics where attorneys volunteer their time to help clear eligible records for Vermonters. It is a very manual process. These clinics generally have a waitlist of Vermonters who cannot be processed.

This project is a chrome extension that let's attorneys generate printable forms rather than copy them from the web by hand. This could bring the time it takes to clear someone's record from around 90 minutes to around 20 minutes, potentially doubling or trippling the number of clients VLA can serve.

# The Chrome extension

This project works through a chrome extension that reads an HTML docket sheet from [VT Courts Online](https://secure.vermont.gov/vtcdas/user) that provides key data a defendant's case. One or more cleaned samples of an HTML docket can be found in the "sampleDocketHTML" folder. When the project is complete, the extension will use the data parsed from the HTML to print petitions for expungement ready for filing.

## Requirements for using this extension

- This tool is designed exclusively for VT Legal Aid.
- Users must have an active subscription with [VT Courts Online](https://secure.vermont.gov/vtcdas/user).
- This tool does not save or expand access to any data.

## Setup for local development

1. Clone the github repository to your machine

1. Open [chrome://extensions/](chrome://extensions/) on your chrome browser.

1. Ensure "Developer mode" is switched on in the top right of the screen.

1. Select `Load unpacked` from the top left, and select the `extensionDirectory` folder from the project folder.

1. Open a sample html docket from the "sampleDocketHTML" folder.

1. While viewing the sample docket page, click the chrome extension icon to begin using the exention.

1. Familiarlize yourself with [how chrome extensions work](./README_EXTENSIONS_OVERVIEW.md).

### Development: Live Reloading the Extension

During plugin development you may need to reload the plugin via the [chrome://extensions/](chrome://extensions/) page. Using Node, your machine can trigger that  reload anytime files within the extension directory are modified. This repo uses an additional plugin, [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid), to do so.  Installation and use of this plugin is not required, it is an optional workflow automation tool.

1. Install the free extension, [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid), from the Chrome webstore.

1. From the root directory of this repository, on your local machine, run `npm install` to install required packages.

1. Run `npm start` to begin watching for changes.

1. To stop watching for changes, use `Ctrl + C` to end the watch in the same terminal window you applied step 3.

You will need to start watching again, using `npm start` after you stop the process.

## Usage instructions

...MORE FUNCTIONALITY AVAILABLE SOON!
