import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class ProductsPage {

    private webAction: WebActions;
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async addProductToCart(productName: string) {
        const productSelector = `[data-test="add-to-cart-${productName.toLowerCase().replace(/\s+/g, '-')}"]`;
        await this.webAction.clickElement(productSelector);
    }

    async goToCart() {
        await this.webAction.clickElement('.shopping_cart_link');
    }
}
