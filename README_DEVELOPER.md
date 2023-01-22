# Developer Quickstart Guide

## Application Structure

From the user's perspective this extension can be divided as follows:

- **Extension Popup**: the popup shown when the user clicks on the extension icon in the browser.
- **Manage Counts Page**: an edit page offering the user a web form where they can manually edit the information used by the extension
- **Petition Page**: a read-only page that provides the user with a print-view of the petitions to be printed and a side navigation with summary information and links to each section
  - **CSV Export**: a button exporting (some? all?) information to CSV for download.
  - **Settings**: allows user to set the preparer information and toggle the VLA logo & footer

## File Structure

From the developer's perspective all code for the chrome extension itself is found in `/extensionDirectory/`:

**Chrome Extention Boilerplate**

The following files are part of any extension. The `manifest.json` is effectively a configuration file for the extension, but generally these files aren't used much:

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

# Deploying this Chrome Extension

## Publishing to the Chrome Store
[The docs explain this](https://developer.chrome.com/docs/webstore/publish/). After you've done this once though, this all you'll need to do the next time.

**Log in**

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Switch to the group publisher account (see below)
3. Click through to the ExpungeVT item

**Version bump**

1. Note the current version published in the developer dashboard
2. Pick the next appropriate [semantic version](https://semver.org/) (major.minor.bug)
3. Commit

**Pem key**

**Create your item's zip file** 
```
$ cd expunge-vt/
$ cd extensionDirectory
$ zip -r ../text-only-7-19-2021.zip *
```

**Upload the zip file**

In the Developer Dashboard, click the 'Package' nav link on the left and pick out your zip file.



## The 'ExpungeVT' publisher account
This extension is deployed under a '[group publisher](https://developer.chrome.com/docs/webstore/group-publishers/)' account which provides a group account where we can grant new developers permission to publish changes to the chrome store. 

### How to add someone to the publisher account
_TODO_ - I forget how to do this. Next time we go through [the instructions](https://developer.chrome.com/docs/webstore/group-publishers/), let's document it here.

### Switching to the publisher acct
Simple, but hard to find: check the [top-right corner for a dropdown](https://developer.chrome.com/docs/webstore/group-publishers/) and switch from your user name to  `expungevt`. If it's not there, then you'll need to be added to the group.

## Next Steps

* npm run build:watch works
* Fix images in components/popup.vue
* Create a separate components/filings.vue and somehow get filings.js to use the right app (filings Or popup) based on... presence of a div??
* Move shared code between components/popup.vue and components/filings.vue so its imported instead of duplicated
