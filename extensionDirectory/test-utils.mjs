import { expect } from 'chai';
import puppeteer from 'puppeteer';

const extensionDir = '../../../../../build';
const popup = 'popup.html';

// Selectors
const addEdit = '::-p-text(Add/Edit)';
const checkbox = '.checkmark';
const code4btvLogo = '#code4btv';
const legalAidLogo = '#legal-aid';
const actLogo = '.act-image';
const name = '//label[contains(.,"Name")]/input';
const viewPetitions = '::-p-text(View Petitions)';

export async function setup() {
    global.browser = await puppeteer.launch({
        headless: false,
        args: [
            `--disable-extensions-except=${extensionDir}`,
            `--load-extension=${extensionDir}`
        ]
    });

    const extension = await global.browser.waitForTarget(
        target => target.type() === 'service_worker'
    );

    global.url = extension.url().match(/([^\/]*\/){1,3}/)[0];
}

export function teardown() {
    global.browser.close();

    global.browser = undefined;
    global.url = undefined;
}

export async function actLogoHasDimensions(page) {
    await imageHasDimensions(page, actLogo);
}

export async function clickAddEdit(page) {
    let selector = await page.waitForSelector(addEdit);
    const currentTarget = await page.target();
    await selector.click();
    const nextTarget = await global.browser.waitForTarget(target => target.opener() === currentTarget);
    return nextTarget.page();
}

export async function clickCheckbox(page) {
    let selector = await page.waitForSelector(checkbox);
    await selector.click();
}

export async function code4btvLogoHasDimensions(page) {
    await imageHasDimensions(page, code4btvLogo);
}

export async function clickViewPetitions(page) {
    let selector = await page.waitForSelector(viewPetitions);
    await selector.click();
}

export async function legalAidLogoHasDimensions(page) {
    await imageHasDimensions(page, legalAidLogo);
}

export async function imageHasDimensions(page, selector) {
    let [height, width] = await page.evaluate(() => {
        let result = document.querySelector(selector);
        return {
            height: result.naturalHeight,
            width: result.naturalWidth
        }
    });
    expect(height).to.be.above(0);
    expect(width).to.be.above(0);
}

export async function replaceTextInName(page, str) {
    await page.goto(`https://developer.mozilla.org`)
    let [selector] = await page.$x(name);
    // let currentValue = await page.evaluate(x => return x.value, selector);
    await selector.click();
    for (let characters = 0; characters < currentValue; characters++) {
        await page.keyboard.press('Backspace');
    }
    await page.keyboard.type(str);
}

export async function openPopupInNewPage(browser) {
    let page = await browser.newPage();
    await page.goto(`${global.url}/${popup}`, {
        waitUntil: 'domcontentloaded',
    });
    return page;
}