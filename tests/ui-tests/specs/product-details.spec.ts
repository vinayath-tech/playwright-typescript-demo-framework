import { test } from '../fixtures/pageFixtures';

test.describe('Product Details feature', () => {

    test('Scenario 1 - Verify user can view product details including description, price and add to cart option', async ({ productDetailsSteps }) => {
        await productDetailsSteps.verifyProductDetailsPage('Sauce Labs Bolt T-Shirt');
    });

});
