import { Page } from "@playwright/test";
import { WebActions } from "../common/webActions";

export class InventoryPage {

    private webAction: WebActions;
    readonly page: Page;

    //Locators
    private productName = '.inventory_item_name';
    private productPrice = '.inventory_item_price';

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async getProductNames(value: string): Promise<string[]> {
        
        await this.webAction.navigateTo('/inventory.html');
        await this.webAction.selectDropdownByValue('[data-test="product-sort-container"]', value);
        const prodNames = await this.webAction.getAllElements(this.productName);
        const prodNamesList: string[] = [];

        for (const prodName of prodNames) {
            const name = await prodName.textContent();
            if(name) prodNamesList.push(name.trim());        
        }

        return prodNamesList
    }

    async getProductPrices(value: string): Promise<number[]> {

         await this.webAction.navigateTo('/inventory.html');
        await this.webAction.selectDropdownByValue('[data-test="product-sort-container"]', value);
        const prodPrices = await this.webAction.getAllElements(this.productPrice);
        const prodPricesList: number[] = [];

        for (const prodPrice of prodPrices) {
            const price = await prodPrice.textContent();
            if(price) prodPricesList.push(parseFloat(price.replace('$', '').trim()));
        }

        return prodPricesList
    }

    async verifyInventoryPageLoaded() {
        await this.webAction.isElementVisible(this.productName);
        await this.webAction.isElementVisible(this.productPrice);
    }

}