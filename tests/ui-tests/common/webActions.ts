import { Page, expect } from '@playwright/test';

export class WebActions {

    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateTo(url: string): Promise<void> {
        await this.page.goto(url);
    }

    async enterText(selector: string, text: string): Promise<void> {
        await this.page.locator(selector).fill(text);
    }

    async clickElement(selector: string): Promise<void> {
        await this.page.locator(selector).click();
    }

    async isElementVisible(selector: string): Promise<boolean> {
        return await this.page.locator(selector).isVisible();
    }

    async isTextPresent(selector: string, expectedText: string) {
        const locator = this.page.locator(selector);
        await expect(locator).toHaveText(expectedText);
    }

}