import { test } from '../fixtures/pageFixtures';

test.describe('Cart feature', () => {

    test('Verify product can be added and removed from cart', async ({ cartSteps }) => {
        await cartSteps.addAndRemoveProductFromCart(
            'Sauce Labs Bolt T-Shirt',
            'testing superhero'
        );
    });
});
