import { test as base, expect } from '@playwright/test';
import LoginSteps from '../steps/loginSteps';
import CheckoutSteps from '../steps/checkoutSteps';
import SortingSteps from '../steps/sortingSteps';
import AxeBuilder from '@axe-core/playwright';

type PageFixtures = {
    loginSteps: LoginSteps;
    checkoutSteps: CheckoutSteps;
    sortingSteps: SortingSteps;
    axeBuilder: () => AxeBuilder;
}

export const test = base.extend<PageFixtures>({
    loginSteps: async ({ page }, use) =>{
        const loginSteps = new LoginSteps(page);
        await use(loginSteps);
    },

    checkoutSteps: async ({ page }, use) => {
        const checkoutSteps = new CheckoutSteps(page);
        await use(checkoutSteps);
    },

    sortingSteps: async( { page }, use) => {
        const sortingSteps = new SortingSteps(page);
        await use(sortingSteps);
    },

    axeBuilder: async ({ page }, use) => {
        const axeBuilder = () => new AxeBuilder({ page });
        await use(axeBuilder);
    }

});