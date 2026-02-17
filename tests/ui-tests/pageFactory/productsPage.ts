import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class ProductsPage {

    private webAction: WebActions;
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async openProductDetails(productName: string) {
        await this.page.locator('.inventory_item_name', { hasText: productName }).click();
    }

    async addProductToCart(productName: string) {
        const productSelector = `[data-test="add-to-cart-${productName.toLowerCase().replace(/\s+/g, '-')}"]`;
        await this.webAction.clickElement(productSelector);
    }

    async goToCart() {
        await this.webAction.clickElement('.shopping_cart_link');
    }

    async getCartBadgeCount(): Promise<number> {
        const badge = this.page.locator('.shopping_cart_badge');
        if (await badge.isVisible()) {
            const text = (await badge.innerText()).trim();
            const count = Number.parseInt(text, 10);
            return Number.isNaN(count) ? 0 : count;
        }

        return 0;
    }
}
