import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class ProductDetailsPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators
    private productName = '.inventory_details_name';
    private productDescription = '.inventory_details_desc';
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

    async clickAddToCart() {
        await this.webAction.clickElement(this.addToCartButton);
    }
}
