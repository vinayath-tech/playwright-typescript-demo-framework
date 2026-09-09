import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class CheckoutPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators
    private itemTotalLabel = '.summary_subtotal_label';
    private taxLabel = '.summary_tax_label';
    private totalLabel = '.summary_total_label';

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async fillCheckoutInformation(firstName: string, lastName: string, postalCode: string) {
        await this.webAction.enterText('#first-name', firstName);
        await this.webAction.enterText('#last-name', lastName);
        await this.webAction.enterText('#postal-code', postalCode);
    }

    async clickContinue() {
        await this.webAction.clickElement('#continue');
    }

    /** Reads the "Item total: $89.97" summary line and returns 89.97 */
    async getItemTotal(): Promise<number> {
        return await this.getAmountFromLabel(this.itemTotalLabel);
    }

    /** Reads the "Tax: $7.20" summary line and returns 7.2 */
    async getTax(): Promise<number> {
        return await this.getAmountFromLabel(this.taxLabel);
    }

    /** Reads the "Total: $97.17" summary line and returns 97.17 */
    async getTotal(): Promise<number> {
        return await this.getAmountFromLabel(this.totalLabel);
    }

    private async getAmountFromLabel(selector: string): Promise<number> {
        const text = (await this.page.locator(selector).textContent())?.trim() ?? '';
        const amount = text.split('$')[1];
        return parseFloat(amount);
    }

    async finishCheckout() {
        await this.webAction.clickElement('#finish');
    }

    async verifyCheckoutComplete(expectedText: string) {
        await this.webAction.isElementVisible('.complete-header');
        await this.webAction.isTextPresent('.complete-header', expectedText);
    }
}
