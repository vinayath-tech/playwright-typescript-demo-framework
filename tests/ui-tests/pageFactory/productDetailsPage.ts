import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class ProductDetailsPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators — sourced from playwright-cli generated code
    private productName = '[data-test="inventory-item-name"]';
    private productDescription = '[data-test="inventory-item-desc"]';
    private productPrice = '[data-test="inventory-item-price"]';
    private addToCartButton = '[data-test="add-to-cart"]';

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async getProductName(): Promise<string> {
        return (await this.page.locator(this.productName).textContent())?.trim() ?? '';
    }

    async getProductDescription(): Promise<string> {
        return (await this.page.locator(this.productDescription).textContent())?.trim() ?? '';
    }

    async getProductPrice(): Promise<string> {
        return (await this.page.locator(this.productPrice).textContent())?.trim() ?? '';
    }

    async clickAddToCart() {
        await this.webAction.clickElement(this.addToCartButton);
    }
}
