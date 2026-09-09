import { test } from '../fixtures/pageFixtures';

test.describe('Logout feature', () => {

    test('Verify user can log out from the burger menu and is returned to the login page', async ({ logoutSteps }) => {
        await logoutSteps.verifyUserCanLogout();
    });

    test('Verify a logged out user cannot open the inventory page directly', async ({ logoutSteps }) => {
        await logoutSteps.verifyProtectedPageBlockedAfterLogout('/inventory.html');
    });
});
