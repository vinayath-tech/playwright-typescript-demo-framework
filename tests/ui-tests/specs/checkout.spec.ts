import { test } from '../fixtures/pageFixtures';

test.describe('Checkout feature', () => {

    test('Verify successful product checkout flow', async ({ checkoutSteps }) => {
        // Complete the entire checkout flow
        await checkoutSteps.completeCheckoutFlow(
            'sauce-labs-backpack',
            'John',
            'Doe',
            '12345'
        );

        // Verify checkout success
        await checkoutSteps.verifyCheckoutSuccess('Thank you for your order!');
    });
});
