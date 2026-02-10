import { test } from '../fixtures/pageFixtures';

test.describe('Product sorting feature', () =>{

    test('Verify product sorting from A to Z', async({ sortingSteps}) => {
        await sortingSteps.verifySortByNameAtoZ();
    });

    test('Verify product sorting from low to high price', async({ sortingSteps}) => {
        await sortingSteps.verifySortPriceLowToHigh();
    });
});