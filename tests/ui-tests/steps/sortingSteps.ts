import BaseSteps from "./baseSteps";
import { expect } from "@playwright/test";

export default class SortingSteps extends BaseSteps {
    

    async verifySortByNameAtoZ() {

       const prodNames = await this.inventoryPage.getProductNames('az');
       const sortedNames = [...prodNames].sort();

       console.log('Product Names:', prodNames);
       console.log('Sorted Names:', sortedNames);

       expect(prodNames).toEqual(sortedNames);
    }

    async verifySortPriceLowToHigh() {

        const prodPrices = await this.inventoryPage.getProductPrices('lohi');
        const sortedPrices = prodPrices.sort((a, b) => a - b);

        console.log('Product Prices:', prodPrices);
        console.log('Sorted Prices:', sortedPrices);

        expect(prodPrices).toEqual(sortedPrices);
    }

}