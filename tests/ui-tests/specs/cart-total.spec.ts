import { test } from '../fixtures/pageFixtures';

test.describe('Cart total calculation', () => {

    test('Verify the total price of multiple products added to the cart is calculated correctly', async ({ cartSteps }) => {
        await cartSteps.verifyCartTotalCalculation(
            ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Fleece Jacket'],
            'John',
            'Doe',
            '12345'
        );
    });

    test('Verify the total price of a single product added to the cart is calculated correctly', async ({ cartSteps }) => {
        await cartSteps.verifyCartTotalCalculation(
            ['Sauce Labs Onesie'],
            'Jane',
            'Roe',
            '54321'
        );
    });
});
