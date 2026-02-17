import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class CartPage {

    private webAction: WebActions;
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async removeProductFromCart(productName: string) {
        const productSelector = `[data-test="remove-${productName.toLowerCase().replace(/\s+/g, '-')}"]`;
        await this.webAction.clickElement(productSelector);
    }

    async getCartItemCount(): Promise<number> {
        return await this.page.locator('.cart_item').count();
    }

    async proceedToCheckout() {
        await this.webAction.clickElement('#checkout');
    }

    async verifyCartPage() {
        await this.webAction.isElementVisible('.cart_list');
    }
}
