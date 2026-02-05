import { test } from '../fixtures/pageFixtures';

test.describe('Login feature', () => {

        test('Verify valid login', async ({ loginSteps }) => {
            await loginSteps.verifyValidLogin('Swag Labs');
        });

        test('Verify invalid login', async ({ loginSteps }) => {
            await loginSteps.verifyInvalidLogin();
        });
});