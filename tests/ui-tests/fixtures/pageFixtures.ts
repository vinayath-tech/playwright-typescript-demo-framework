import { test as base, expect } from '@playwright/test';
import LoginSteps from '../steps/loginSteps';
import CheckoutSteps from '../steps/checkoutSteps';
import SortingSteps from '../steps/sortingSteps';
import CartSteps from '../steps/cartSteps';
import ProductDetailsSteps from '../steps/productDetailsSteps';
import LogoutSteps from '../steps/logoutSteps';
import AxeBuilder from '@axe-core/playwright';
import { WebActions } from '../common/webActions';

type PageFixtures = {
    loginSteps: LoginSteps;
    checkoutSteps: CheckoutSteps;
    sortingSteps: SortingSteps;
    cartSteps: CartSteps;
    productDetailsSteps: ProductDetailsSteps;
    logoutSteps: LogoutSteps;
    axeBuilder: () => AxeBuilder;
    /** Visual testing handle — call assertVisualMatch() to snapshot-test the current page. */
    visualActions: WebActions;
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

    cartSteps: async ({ page }, use) => {
        const cartSteps = new CartSteps(page);
        await use(cartSteps);
    },

    productDetailsSteps: async ({ page }, use) => {
        const productDetailsSteps = new ProductDetailsSteps(page);
        await use(productDetailsSteps);
    },

    logoutSteps: async ({ page }, use) => {
        const logoutSteps = new LogoutSteps(page);
        await use(logoutSteps);
    },

    axeBuilder: async ({ page }, use) => {
        const axeBuilder = () => new AxeBuilder({ page });
        await use(axeBuilder);
    },

    visualActions: async ({ page }, use) => {
        await use(new WebActions(page));
    }

});