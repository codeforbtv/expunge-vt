# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ExpungeVT is a **Manifest V3 Chrome extension** used by Vermont attorneys generally (built in collaboration with Vermont Legal Aid) to auto-generate printable criminal-record expungement/sealing petitions. It scrapes case data from Vermont court docket pages, lets the attorney correct/enter data, then renders print-ready petitions grouped by county (and optionally by docket).

**All extension code lives in [extensionDirectory/](extensionDirectory/).** Run every command below from that folder, not the repo root.

## Commands

```bash
cd extensionDirectory

# Install — plain `npm install` HANGS: the puppeteer devDep downloads Chromium
# (~150MB) and stalls behind proxies. For build-only work, skip it:
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Build → outputs the unpacked extension into build/
npm run build            # runs `node build.js` (esbuild). Won't hang; puppeteer isn't a runtime dep.

# Format
npm run pretty-up        # prettier --write over js/html/css
npm run pretty-check

# Tests — puppeteer e2e, launches a REAL headed Chrome that loads build/
npm test                 # requires a prior `npm run build` AND puppeteer's Chromium installed
# Single test (mocha --grep):
node ./node_modules/mocha/bin/mocha.js --require mocha-fixtures.mjs --config .mocharc.js test/e2e/html-sample.spec.mjs --grep "checkbox"
```

- Node **19.2.0** is the expected version (per README).
- There is **no watch mode** — `build:watch` is a TODO stub. Re-run `npm run build` after each change, then click reload on the extension card at `chrome://extensions`.
- To load in Chrome: `chrome://extensions` → Developer mode → **Load unpacked** → select `extensionDirectory/build/`.

## Build system

- The real bundler is **esbuild**, configured inline in [build.js](extensionDirectory/build.js). `webpack.config.js` is legacy/unused — ignore it.
- Entry points bundled: `background.js`, `store.mjs`, `index.js`, `manage-counts.js`, `payload.js`, `filings.js`, `saveFile.js`.
- Source of truth vs. generated output:
  - Edit source in `extensionDirectory/` and static assets (manifest, `*.html`, images) in [extensionDirectory/static/](extensionDirectory/static/).
  - **Never edit `extensionDirectory/build/`** — it is regenerated on every build (esbuild bundles + `static/` is copied in).
- `build.js` also fires `npm install --omit=dev` inside `build/` as a fire-and-forget post-step to populate production deps.

## Architecture — the data flow

This is a plain-JS extension where **Vue 3 is used only as a templating engine** (do not treat it as a typical Vue SPA). State lives in **two layers**: a Pinia store ([store.mjs](extensionDirectory/store.mjs), `useDataStore`) and `chrome.storage.local` — keep them in mind together when tracing data.

1. **[background.js](extensionDirectory/background.js)** — the MV3 service worker. Uses `declarativeContent` to decide which pages show the extension icon (the VT court portals, the demo site, local files, new tabs). Clears `chrome.storage.local` on browser startup.

2. **[payload.js](extensionDirectory/payload.js)** — injected into the docket page as a content script. Reads the raw docket HTML (`#roa-content`) based on `window.location.hostname`, wraps it in a `docketData` object, and `chrome.runtime.sendMessage`s it back. It's a dumb grabber — parsing happens elsewhere.

3. **[popup.js](extensionDirectory/popup.js)** — the brain. Listens for the payload message, parses raw docket HTML into `PetitionerInfo` + count objects (`getOdysseyPetitionerInfo`), **merges** with previously-saved counts (dedupes by count `uid`, prompts to confirm on defendant-name mismatch), and persists the result to `chrome.storage.local` under `counts`/`responses`.

4. **Three UI surfaces**, each its own bundle that mounts a Vue app reading from Pinia + `chrome.storage`:
   - **Popup** — [index.js](extensionDirectory/index.js) → `popup.js` + [components/popup.vue](extensionDirectory/components/popup.vue). Dashboard, terms acceptance, preparer/settings.
   - **Manage Counts** — [manage-counts.js](extensionDirectory/manage-counts.js) → [components/manage-counts.vue](extensionDirectory/components/manage-counts.vue). Editable form over the parsed data.
   - **Petitions/Filings** — [filings.js](extensionDirectory/filings.js) → [components/filings.vue](extensionDirectory/components/filings.vue). Print view of petitions grouped by county/docket, plus CSV export and side-nav.

5. **Save/Load case files** — [saveFile.js](extensionDirectory/saveFile.js) serializes all data into a **Base64-obfuscated, self-contained HTML file** (title `ExpungeVT Case Record`) the user downloads. Re-opening that file in Chrome routes through the `expungeVtRecord` branch in `payload.js`/`popup.js` to restore state. This is why the `downloads` permission exists and why `payload.js` handles the `file://` case.

## Domain concepts

- **Odyssey** = the VT Judiciary Public Portal (Tyler Technologies). Two live hostnames handled: `portal.vtcourts.gov` and `publicportal.courts.vt.gov`. `htmlpreview.github.io`/`localhost` are the demo/dev paths that reuse the Odyssey parser. Older "VCOL" references are legacy.
- **Counties**: petitions are organized by Vermont's 14 counties, each with a court code (e.g. `Ancr`=Addison, `Cncr`=Chittenden). The county-code ↔ county-name maps live in [popup.js](extensionDirectory/popup.js).
- **Counts / dockets**: a docket contains counts; counts carry a `uid` used for dedup when merging multiple scrapes for the same petitioner.
- Test dockets live in [sampleDocketHTML/](sampleDocketHTML/); [clinicDocs/](clinicDocs/) holds the blank reference forms the petitions replicate (reference only, unused by code).

## Release / gotchas

- A release requires bumping the version in **both** [extensionDirectory/package.json](extensionDirectory/package.json) and [extensionDirectory/static/manifest.json](extensionDirectory/static/manifest.json) (currently 5.1.3), then zipping `build/` for the Chrome Web Store (see [extensionDirectory/README.md](extensionDirectory/README.md)).
- The **root [README.md](README.md) publishes to the public GitHub Pages site on merge to `master`** — keep its content public-appropriate.
