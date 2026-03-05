import { expect } from '@playwright/test';
import BaseSteps from './baseSteps';

export default class ProductDetailsSteps extends BaseSteps {

    async verifyProductDetailsPage(productName: string) {
        // Generated: await page.goto('/inventory.html') via goToLandingPage
        await this.loginPage.goToLandingPage();
        await this.inventoryPage.verifyInventoryPageLoaded();

        // Generated: await page.locator('[data-test$="-title-link"]', { hasText: productName }).click()
        await this.productsPage.openProductDetails(productName);

        // Verify navigated to product detail page
        await expect(this.page).toHaveURL(/inventory-item\.html\?id=/);

        // Generated: page.locator('[data-test="inventory-item-desc"]') — description visible
        await expect(this.page.locator('[data-test="inventory-item-desc"]')).toBeVisible();

        // Generated: page.locator('[data-test="inventory-item-name"]') — assert product name
        const actualName = await this.productDetailsPage.getProductName();
        expect(actualName).toBe(productName);

        // Generated: page.locator('[data-test="inventory-item-desc"]') — assert description non-empty
        const description = await this.productDetailsPage.getProductDescription();
        expect(description).toBeTruthy();

        // Generated: page.locator('[data-test="inventory-item-price"]') — assert price format
        const price = await this.productDetailsPage.getProductPrice();
        expect(price).toMatch(/^\$\d+\.\d{2}$/);

        // Generated: page.locator('[data-test="add-to-cart"]') — assert button visible
        await expect(this.page.locator('[data-test="add-to-cart"]')).toBeVisible();
    }
}
