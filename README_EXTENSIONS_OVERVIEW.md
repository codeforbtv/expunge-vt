# Getting Started with Chrome Extensions

The ExpungeVT Chrome Extension is located inside the 'extensionDirectory' folder in this repo. The following is a brief overview of the extension codebase with links to resources for further exploration.

## Structure of an Extension

The structure of a chrome extension is primarily defined in the manifest.json file

`manifest.json` [[Docs](https://developer.chrome.com/extensions/manifest)]: This file details the important information about your extension, like its name and which permissions it needs. Here are a few choice highlights, but review the official docs because this is the foundation of each chrome extension.

- `page_action` [[Docs](https://developer.chrome.com/extensions/pageAction)]: adds icons to the main Google Chrome toolbar. Page actions represent actions that can be taken on the current page, but that aren't applicable to all pages. Page actions appear grayed out when inactive.

- `options_page` [[Docs](https://developer.chrome.com/extensions/options)]: Allow users to ​customize the behavior of an extension by providing an options page.

- `background` [[Docs](https://developer.chrome.com/extensions/background_pages)]: Background scripts are triggered by browser events such as navigating toa new page, closing a tab, etc.

* `permissions`​​ [[Docs](https://developer.chrome.com/extensions/permission_warnings)]: Chrome extensions can behave in ways that most web content is prohibited from doing. Permissions allow extensions to use certain features, such as ​access the ​cookies​ & ​storage​ for other tabs​ and​ perform​ Cross-Origin XMLHttpRequsts. Reviewing [the permission list](https://developer.chrome.com/extensions/declare_permissions) gives you a good idea of the kinds of features an extension could implement.

## Common Extension Elements

### Background Scripts

These are scripts that respond to Chrome Extension actions and triggers. They aren't really visible to the user (..'cause they're background scripts), but they provide some important types of behavior.

### Extension Popup

This is the content that is displayed in a popup when you click on the extension icon to the right of the address bar. This is often used as kind of a navigation or dashboard to help users figure out what actions to take with the extension.

### Content Scripts

These are scripts that are injected into other html pages. This is the primary way that you can add additional functionality to specific sites or types of pages.

## Debugging Extensions [(docs)](https://developer.chrome.com/extensions/tut_debugging)

The dev tools can be used to inspect and debug an extension roughly same way they can be used on normal web content. There are of course some differences with extensions.

## Read These Next

- [How to Create and Publish a Chrome Extension in 20 minutes](https://medium.freecodecamp.org/how-to-create-and-publish-a-chrome-extension-in-20-minutes-6dc8395d7153): Good tutorial intro.
- [Javascript Jabber Ep 233](https://devchat.tv/js-jabber/233-jsj-google-chrome-extensions-with-john-sonmez/): Great 25 minute overview podcast on chrome extensions.
- [Google Developer Docs](https://developer.chrome.com/extensions): Excellent documentation including tutorials, apis, and a variety of boilerplate extensions to work with.
