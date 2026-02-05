import { test as base, expect } from '@playwright/test';
import LoginSteps from '../steps/loginSteps';

type PageFixtures = {
    loginSteps: LoginSteps;
}

export const test = base.extend<PageFixtures>({
    loginSteps: async ({ page }, use) =>{
        const loginSteps = new LoginSteps(page);
        await use(loginSteps);
    }

});