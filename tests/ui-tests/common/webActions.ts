import { Page, expect } from '@playwright/test';
import { Locator } from 'playwright';

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
        return await this.page.locator(selector).first().isVisible();
    }

    async isTextPresent(selector: string, expectedText: string) {
        const locator = this.page.locator(selector);
        await expect(locator).toHaveText(expectedText);
    }

    async getAllElements(selector: string): Promise<Locator[]> {
        const eles = this.page.locator(selector).all();
        return eles;
    }

    async selectDropdownByValue(selector: string, value: string): Promise<void> {
        await this.page.selectOption(selector, value);
    }

}