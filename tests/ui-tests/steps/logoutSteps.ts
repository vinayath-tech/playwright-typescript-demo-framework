import { expect } from '@playwright/test';
import BaseSteps from './baseSteps';

/** Cookie Swag Labs uses to hold the authenticated session. */
const SESSION_COOKIE = 'session-username';

export default class LogoutSteps extends BaseSteps {

    /**
     * Logs out via the burger menu and verifies the user is returned to the
     * login page with a clean form and no session cookie left behind.
     */
    async verifyUserCanLogout() {
        await this.loginPage.goToLandingPage();
        await this.inventoryPage.verifyInventoryPageLoaded();

        await this.menuPage.openMenu();
        expect(await this.menuPage.isLogoutLinkVisible(),
            'Logout link should be visible in the burger menu').toBe(true);

        await this.menuPage.clickLogout();

        await expect(this.page).toHaveURL(/saucedemo\.com\/$/);
        expect(await this.loginPage.isLoginFormVisible(),
            'login form should be shown after logout').toBe(true);
        expect(await this.loginPage.getUsernameFieldValue(),
            'username field should be cleared after logout').toBe('');

        const cookies = await this.page.context().cookies();
        expect(cookies.find(cookie => cookie.name === SESSION_COOKIE),
            `${SESSION_COOKIE} cookie should be cleared on logout`).toBeUndefined();
    }

    /**
     * Logs out, then confirms the session is genuinely dead — a direct request
     * for a protected page is rejected rather than served from a stale session.
     */
    async verifyProtectedPageBlockedAfterLogout(protectedPath: string) {
        await this.loginPage.goToLandingPage();
        await this.inventoryPage.verifyInventoryPageLoaded();

        await this.menuPage.openMenu();
        await this.menuPage.clickLogout();
        await expect(this.page).toHaveURL(/saucedemo\.com\/$/);

        await this.page.goto(protectedPath);

        await expect(this.page).toHaveURL(/saucedemo\.com\/$/);
        await expect(this.page.locator('.inventory_list')).toHaveCount(0);
        expect(await this.loginPage.getErrorMessage())
            .toContain(`You can only access '${protectedPath}' when you are logged in.`);
    }
}
