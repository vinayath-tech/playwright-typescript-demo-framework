import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class CartPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators
    private cartItem = '.cart_item';
    private cartItemName = '.inventory_item_name';
    private cartItemPrice = '.inventory_item_price';
    private cartItemQuantity = '.cart_quantity';

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

    async getCartItemNames(): Promise<string[]> {
        const names = await this.webAction.getAllElements(`${this.cartItem} ${this.cartItemName}`);
        const nameList: string[] = [];

        for (const name of names) {
            const text = await name.textContent();
            if (text) nameList.push(text.trim());
        }

        return nameList;
    }

    async getCartItemPrices(): Promise<number[]> {
        const prices = await this.webAction.getAllElements(`${this.cartItem} ${this.cartItemPrice}`);
        const priceList: number[] = [];

        for (const price of prices) {
            const text = await price.textContent();
            if (text) priceList.push(parseFloat(text.replace('$', '').trim()));
        }

        return priceList;
    }

    async getCartItemQuantities(): Promise<number[]> {
        const quantities = await this.webAction.getAllElements(`${this.cartItem} ${this.cartItemQuantity}`);
        const quantityList: number[] = [];

        for (const quantity of quantities) {
            const text = await quantity.textContent();
            if (text) quantityList.push(parseInt(text.trim(), 10));
        }

        return quantityList;
    }

    async proceedToCheckout() {
        await this.webAction.clickElement('#checkout');
    }

    async verifyCartPage() {
        await this.webAction.isElementVisible('.cart_list');
    }
}
