import { expect } from '@playwright/test';
import BaseSteps from './baseSteps';

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
}
