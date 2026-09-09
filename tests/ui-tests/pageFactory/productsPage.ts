import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class ProductsPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators
    private inventoryItem = '.inventory_item';
    private inventoryItemName = '.inventory_item_name';
    private inventoryItemPrice = '.inventory_item_price';

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async openProductDetails(productName: string) {
        // Generated pattern: page.locator('[data-test="item-{id}-title-link"]') — using wildcard for generic by-name click
        await this.page.locator('[data-test$="-title-link"]', { hasText: productName }).click();
    }

    async addProductToCart(productName: string) {
        // const productSelector = `[data-test="add-to-cart-${productName.toLowerCase().replace(/\s+/g, '-')}"]`;
        const productSelector = `[data-test="add-to-cart-${productName.toLowerCase().replace(/\s+/g, '-')}"]`;
        await this.webAction.clickElement(productSelector);
    }

    /** Product name -> advertised price, as listed on the inventory page. */
    async getInventoryPrices(): Promise<Map<string, number>> {
        const items = await this.webAction.getAllElements(this.inventoryItem);
        const prices = new Map<string, number>();

        for (const item of items) {
            const name = (await item.locator(this.inventoryItemName).textContent())?.trim();
            const price = (await item.locator(this.inventoryItemPrice).textContent())?.trim();
            if (name && price) prices.set(name, parseFloat(price.replace('$', '')));
        }

        return prices;
    }

    async goToCart() {
        await this.webAction.clickElement("#shopping_cart_container > a.shopping_cart_link");
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
