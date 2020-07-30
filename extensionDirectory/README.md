# Developer Quickstart Guide

## Application Structure

From the user's perspective this extension can be divided as follows:

- **Extention Popup**: the popup shown when the user clicks on the extension icon in the browser.
- **Manage Counts Page**: an edit page offering the user a web form where they can manually edit the information used by the extension
- **Petition Page**: a read-only page that provides the user with a print-view of the petitions to be printed and a side navigation with summary information and links to each section
  - **CSV Export**: a button exporting (some? all?) information to CSV for download.
  - **Settings**: allows user to set the preparer information and toggle the VLA logo & footer

## File Structure

From the developer's perspective all code for the chrome extension itself is found in `/extensionDirectory/`:

**Chrome Extention Boilerplate**

The following files are part of any extension. The `manifest.json` is effectively a configuration file for the extention, but generally these files aren't used much:

```
├── extensionDirectory
│   ├── manifest.json
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   ├── images/
│   ├── background.js
│   ├── payload.js
│   ├── ...
```

**Chrome Extension "meat"**

These map to the 3 primary pieces of [Application Structure](#application-structure)

- popup.html/js/css runs the extension popup
- manage-counts.html runs the Manage Counts page
- filings.html/js/css runs the Petition page

```
├── extensionDirectory
│   ├── ...
│   ├── popup.css
│   ├── popup.html
│   ├── popup.js
│   ├── manage-counts.html
│   ├── filings.css
│   ├── filings.html
│   ├── filings.js
│   ├── ...
```

**Supporting Files**

The remaining files have various purposes:

- `components.js` holds the vue components (used only for rendering purposes)
- `csv.js` some helper functions for letting users download a csv
- `disclaimer.html` holds the Terms & Conditions

```
│   ├── ...
│   ├── components.js
│   ├── csv.js
│   └── disclaimer.html
```

## Supporting Libraries

- **Vue.js**: used as templating engine only - do not confuse this project with a typical vue app! We're just using vue to make the rendering a little cleaner.
- **Gumshoe & Smooth Scroll**: Just a couple packages to help with the navigation links on the Manage Counts page.
- **Bootstrap**: BS4 as a quick way to make things a little more pretty.
