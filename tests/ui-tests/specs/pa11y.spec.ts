import { test } from '../fixtures/pageFixtures';
import { checkAccessibility } from '../helpers/pa11yHelper';

test.describe('Accessibility tests with Pa11y', {tag:'@accessibility'}, () => {

    test('Verify accessibility of Login page', async ({ loginSteps, axeBuilder }) => {

        await loginSteps.verifyInvalidLogin();
        await checkAccessibility(axeBuilder);
    });

    test('Verify accessibility of Landing page', async ({ loginSteps, axeBuilder }) => {

        await loginSteps.verifyValidLogin('Swag Labs');
        await checkAccessibility(axeBuilder);
    });
});