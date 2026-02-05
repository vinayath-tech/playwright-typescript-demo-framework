import {test as setup, expect} from '@playwright/test';
import { ENV } from '../../../lib/env';
import path from 'path'

const authFile = path.join(__dirname, '../../../playwright/.auth/userAuth.json');

setup('Authentication set up for UI tests', async ({ page }) => {

    const uname = ENV.UI_VALID_USERNAME || '';
    const pwd = ENV.UI_VALID_PASSWORD || '';

    await page.goto('/');
    await page.fill('#user-name', uname);
    await page.fill('#password', pwd);
    await page.click('#login-button');

    //Verify successful login by checking for the presence of the products page element
    await expect(page.locator('.inventory_list')).toBeVisible();

    //Save authentication state to a file for use in other tests
    await page.context().storageState({ path:authFile})

});