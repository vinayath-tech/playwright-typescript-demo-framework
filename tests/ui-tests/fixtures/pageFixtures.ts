import { test as base, expect } from '@playwright/test';
import LoginSteps from '../steps/loginSteps';
import CheckoutSteps from '../steps/checkoutSteps';

type PageFixtures = {
    loginSteps: LoginSteps;
    checkoutSteps: CheckoutSteps;
}

export const test = base.extend<PageFixtures>({
    loginSteps: async ({ page }, use) =>{
        const loginSteps = new LoginSteps(page);
        await use(loginSteps);
    },

    checkoutSteps: async ({ page }, use) => {
        const checkoutSteps = new CheckoutSteps(page);
        await use(checkoutSteps);
    }

});