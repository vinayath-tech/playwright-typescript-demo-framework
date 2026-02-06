import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class CheckoutPage {

    private webAction: WebActions;
    readonly page: Page;

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

    async finishCheckout() {
        await this.webAction.clickElement('#finish');
    }

    async verifyCheckoutComplete(expectedText: string) {
        await this.webAction.isElementVisible('.complete-header');
        await this.webAction.isTextPresent('.complete-header', expectedText);
    }
}
