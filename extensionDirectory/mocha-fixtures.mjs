import { mkdirSync, access, constants } from 'fs';

const screenshots = './screenshots'

export async function mochaGlobalSetup() {
    access(screenshots, constants.F_OK, (err) => {
        if (err) {
            mkdirSync(screenshots);
        }
    })    
}