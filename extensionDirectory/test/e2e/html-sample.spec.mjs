import { actLogoHasDimensions, clickCheckbox, code4btvLogoHasDimensions, legalAidLogoHasDimensions, openPopupInNewPage, setup, teardown } from '../../test-utils.mjs';

describe('popup.html', async function() {

    beforeEach(async () => {
        await setup();
    });

    afterEach(async () => {
        teardown();
    });

    it('should display the Code for BTV, Vermont Legal Aid, and Alliance of Civic Technologists image logos', async function() {
        let page = await openPopupInNewPage(global.browser);
        actLogoHasDimensions(page);
        code4btvLogoHasDimensions(page);
        legalAidLogoHasDimensions(page);
    })

    it('should display a checkbox that can be clicked.', async function() {
        let page = await openPopupInNewPage(global.browser);
        await page.screenshot({ path: './screenshots/popup_inital_load.png'});
        await clickCheckbox(page);
        await page.screenshot({ path: './screenshots/popup_terms_clicked.png'});
        
    })
})
