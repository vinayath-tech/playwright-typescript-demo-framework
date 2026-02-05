import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';
import { ENV } from '../../../lib/env';

export class LoginPage {

    private webAction: WebActions;
    readonly page: Page;
    private invalid_username: string;
    private invalid_password: string;

    constructor(page:Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
        this.invalid_username = ENV.UI_INVALID_USERNAME || '';
        this.invalid_password = ENV.UI_INVALID_PASSWORD || '';
    };

    async goToLandingPage() {
        await this.webAction.navigateTo('/inventory.html');
    }

    async goToLoginPage() {
        await this.webAction.navigateTo('/');
    }

    async verifyLoginSuccess(expText: string) {
        await this.webAction.isElementVisible('.inventory_list');
        await this.webAction.isTextPresent('.app_logo', expText);
    }

    async verifyLoginFailure() {
        await this.webAction.enterText('#user-name', this.invalid_username);
        await this.webAction.enterText('#password', this.invalid_password);
        await this.webAction.clickElement('#login-button');
        await this.webAction.isElementVisible('[data-test="error"]');
    }
}