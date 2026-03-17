import { test } from '../fixtures/pageFixtures';

/**
 * Visual regression tests.
 *
 * Each test navigates to a page and calls visualActions.assertVisualMatch()
 * with a unique snapshot name.
 *
 * First run   — no baseline exists yet; the screenshot is saved as the
 *               baseline and the test passes immediately.
 * Subsequent  — the current screenshot is sent alongside the stored baseline
 *               to the LLM which decides whether a regression is present.
 *
 * Mode behaviour (configured via VISUAL_TESTING_MODE in env/.env.test):
 *   review — diffs are queued for human approval; test passes this run.
 *            Run `npm run visual:review` to approve (update baseline) or reject.
 *   auto   — test fails immediately on any detected mismatch.
 *
 * Requires VISUAL_TESTING_ENABLED=true in env/.env.test.
 */
test.describe('@visual Visual Regression', () => {

    test('products page matches baseline', async ({ visualActions }) => {
        await visualActions.navigateTo('/');
        await visualActions.assertVisualMatch('products-page');
    });

    test('cart page matches baseline', async ({ visualActions }) => {
        await visualActions.navigateTo('/cart.html');
        await visualActions.assertVisualMatch('cart-page');
    });

    test('product detail page matches baseline', async ({ visualActions }) => {
        await visualActions.navigateTo('/inventory-item.html?id=4');
        await visualActions.assertVisualMatch('product-detail-page');
    });

    test('products page full-page scroll matches baseline', async ({ visualActions }) => {
        await visualActions.navigateTo('/');
        await visualActions.assertVisualMatch('products-page-full', { fullPage: true });
    });

});
