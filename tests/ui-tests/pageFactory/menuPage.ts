import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

/**
 * The burger (hamburger) side menu available on every authenticated page.
 * Holds the All Items / About / Logout / Reset App State links.
 */
export class MenuPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators
    private openMenuButton = '#react-burger-menu-btn';
    private closeMenuButton = '#react-burger-cross-btn';
    private allItemsLink = '#inventory_sidebar_link';
    private logoutLink = '#logout_sidebar_link';
    private resetAppStateLink = '#reset_sidebar_link';

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async openMenu() {
        await this.webAction.clickElement(this.openMenuButton);
    }

    async closeMenu() {
        await this.webAction.clickElement(this.closeMenuButton);
    }

    async isLogoutLinkVisible(): Promise<boolean> {
        return await this.webAction.isElementVisible(this.logoutLink);
    }

    async clickLogout() {
        await this.webAction.clickElement(this.logoutLink);
    }

    async clickAllItems() {
        await this.webAction.clickElement(this.allItemsLink);
    }

    async clickResetAppState() {
        await this.webAction.clickElement(this.resetAppStateLink);
    }
}
