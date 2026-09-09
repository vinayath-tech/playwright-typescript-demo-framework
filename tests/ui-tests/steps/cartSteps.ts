import { expect } from '@playwright/test';
import BaseSteps from './baseSteps';

/** Sales tax rate applied by Swag Labs on the checkout overview. */
const TAX_RATE = 0.08;

/** Currency values are compared to the cent, so round away float noise first. */
function toCents(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100);
}

export default class CartSteps extends BaseSteps {

    async addAndRemoveProductFromCart(productName: string, expectedDescriptionSnippet: string) {
        await this.page.goto('/inventory.html');
        await this.inventoryPage.verifyInventoryPageLoaded();

        await this.productsPage.openProductDetails(productName);

        await expect(this.page).toHaveURL(/inventory-item\.html\?id=/);
        await expect(this.page.locator('.inventory_details_desc')).toBeVisible();

        const actualName = await this.productDetailsPage.getProductName();
        expect(actualName).toBe(productName);

        const description = await this.productDetailsPage.getProductDescription();
        expect(description).toContain(expectedDescriptionSnippet);

        await this.productDetailsPage.clickAddToCart();
        await expect(this.page.locator('.shopping_cart_badge')).toHaveText('1');

        await this.productsPage.goToCart();
        await this.cartPage.verifyCartPage();

        await this.cartPage.removeProductFromCart(productName);

        await expect(this.page.locator('.cart_item')).toHaveCount(0);
        await expect(this.page.locator('.shopping_cart_badge')).toHaveCount(0);
    }

    /**
     * Adds the given products and verifies the money maths end to end:
     * cart line prices match the advertised inventory prices, the item total is
     * the sum of the lines, tax is TAX_RATE of the item total, and the grand
     * total is item total + tax.
     */
    async verifyCartTotalCalculation(
        productNames: string[],
        firstName: string,
        lastName: string,
        postalCode: string
    ) {
        await this.loginPage.goToLandingPage();
        await this.inventoryPage.verifyInventoryPageLoaded();

        const inventoryPrices = await this.productsPage.getInventoryPrices();

        for (const productName of productNames) {
            expect(inventoryPrices.has(productName),
                `"${productName}" is not listed on the inventory page`).toBe(true);
            await this.productsPage.addProductToCart(productName);
        }

        expect(await this.productsPage.getCartBadgeCount()).toBe(productNames.length);

        await this.productsPage.goToCart();
        await this.cartPage.verifyCartPage();

        // Every line in the cart must carry the price advertised on the inventory page.
        const cartNames = await this.cartPage.getCartItemNames();
        const cartPrices = await this.cartPage.getCartItemPrices();
        const cartQuantities = await this.cartPage.getCartItemQuantities();

        expect(cartNames).toEqual(productNames);
        expect(cartPrices).toHaveLength(productNames.length);
        expect(cartQuantities).toHaveLength(productNames.length);

        cartNames.forEach((name, index) => {
            expect(toCents(cartPrices[index]),
                `cart price for "${name}" differs from the inventory price`)
                .toBe(toCents(inventoryPrices.get(name) as number));
        });

        const expectedItemTotal = cartPrices.reduce(
            (sum, price, index) => sum + price * cartQuantities[index], 0
        );

        await this.cartPage.proceedToCheckout();
        await this.checkoutPage.fillCheckoutInformation(firstName, lastName, postalCode);
        await this.checkoutPage.clickContinue();

        await expect(this.page).toHaveURL(/checkout-step-two\.html/);

        const itemTotal = await this.checkoutPage.getItemTotal();
        const tax = await this.checkoutPage.getTax();
        const total = await this.checkoutPage.getTotal();

        expect(toCents(itemTotal), 'item total should be the sum of the cart line prices')
            .toBe(toCents(expectedItemTotal));

        expect(toCents(tax), `tax should be ${TAX_RATE * 100}% of the item total`)
            .toBe(toCents(itemTotal * TAX_RATE));

        expect(toCents(total), 'total should be the item total plus tax')
            .toBe(toCents(itemTotal) + toCents(tax));
    }
}
