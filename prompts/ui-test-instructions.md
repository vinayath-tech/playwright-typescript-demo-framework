<!-- ---
name: ui-test
description: Playwright UI test generator. Use when asked to write, create, or generate UI or API tests. Performs a manual browser journey first using playwright-cli in headed Chrome, then generates a TypeScript Playwright test following the POM pattern, and runs it.
disable-model-invocation: true
--- -->

## General Rules
- You are a Playwright UI & API test generator.
- Perform a manual journey of the test scenario using `playwright-cli` in **Chrome headed mode**.
- Do NOT use `playwright-mcp`.
- Execute steps one by one using the playwright-cli tools.
- After the manual test passes, generate a Playwright test in TypeScript following the POM pattern implemented in this project.
- Once the test is scripted, run it to verify it passes.

## Step 1 — Manual Test Journey

1. Launch Chrome in headed mode using playwright-cli.
2. Execute the test scenario step by step:
   - Navigate to the target URL.
   - Perform all user interactions (clicks, fills, selections, etc.) one step at a time.
   - Take a screenshot after key actions to confirm state.
   - Validate expected outcomes visually or by reading text/attributes.
3. Confirm the manual journey passes before proceeding.

---

## Step 2 — Automation Test Generation

Follow the Page Object Model (POM) architecture used in this project.

Always read existing files in `tests/ui-tests/` first to understand current patterns before generating any code.

---

### Layer 1 — Page (`tests/ui-tests/pageFactory/`)

Holds **locators and low-level UI interactions only**. No business logic. Use `WebActions` for all interactions.

```typescript
// tests/ui-tests/pageFactory/productDetailsPage.ts
import { Page } from '@playwright/test';
import { WebActions } from '../common/webActions';

export class ProductDetailsPage {

    private webAction: WebActions;
    readonly page: Page;

    // Locators
    private productName = '.inventory_details_name';
    private productDescription = '.inventory_details_desc';
    private productPrice = '.inventory_details_price';
    private addToCartButton = '[data-test="add-to-cart"]';

    constructor(page: Page) {
        this.page = page;
        this.webAction = new WebActions(this.page);
    }

    async getProductName(): Promise<string> {
        return (await this.page.locator(this.productName).textContent())?.trim() ?? '';
    }

    async getProductDescription(): Promise<string> {
        return (await this.page.locator(this.productDescription).textContent())?.trim() ?? '';
    }

    async getProductPrice(): Promise<string> {
        return (await this.page.locator(this.productPrice).textContent())?.trim() ?? '';
    }

    async clickAddToCart() {
        await this.webAction.clickElement(this.addToCartButton);
    }
}
```

**Rules:**
- One file per page/component.
- Only CSS selectors or `data-test` attributes as locators — no XPath.
- Methods return raw values or perform single actions — no assertions here.
- Always instantiate `WebActions` and use it instead of calling `page.*` directly.

---

### Layer 2 — Steps (`tests/ui-tests/steps/`)

Orchestrates page objects to fulfil a test scenario. Contains **business logic and assertions**. Always extends `BaseSteps`.

```typescript
// tests/ui-tests/steps/productDetailsSteps.ts
import { expect } from '@playwright/test';
import BaseSteps from './baseSteps';

export default class ProductDetailsSteps extends BaseSteps {

    async verifyProductDetailsPage(productName: string) {
        await this.page.goto('/inventory.html');
        await this.inventoryPage.verifyInventoryPageLoaded();

        await this.productsPage.openProductDetails(productName);

        await expect(this.page).toHaveURL(/inventory-item\.html\?id=/);

        const actualName = await this.productDetailsPage.getProductName();
        expect(actualName).toBe(productName);

        const description = await this.productDetailsPage.getProductDescription();
        expect(description.length).toBeGreaterThan(0);

        const price = await this.productDetailsPage.getProductPrice();
        expect(price).toMatch(/^\$[\d.]+$/);

        await expect(this.page.locator('[data-test="add-to-cart"]')).toBeVisible();
    }
}
```

**Rules:**
- Extend `BaseSteps` — all page objects are already available via `this.<pageName>`.
- Each method maps to one test scenario or a clearly named action.
- `expect` assertions live here, not in the page layer.
- Navigate using `this.page.goto(path)` with relative paths (baseURL is set in config).

---

### Layer 3 — Base (`tests/ui-tests/steps/baseSteps.ts`)

All page objects are instantiated here. **Do not modify** unless adding a new page object.

```typescript
// tests/ui-tests/steps/baseSteps.ts  (reference — do not recreate)
import { Page } from "@playwright/test";
import { LoginPage } from "../pageFactory/loginPage";
import { ProductsPage } from "../pageFactory/productsPage";
import { CartPage } from "../pageFactory/cartPage";
import { CheckoutPage } from "../pageFactory/checkoutPage";
import { InventoryPage } from "../pageFactory/inventoryPage";
import { ProductDetailsPage } from "../pageFactory/productDetailsPage";

export default class BaseSteps {
    readonly page: Page;
    readonly loginPage: LoginPage;
    readonly productsPage: ProductsPage;
    readonly cartPage: CartPage;
    readonly checkoutPage: CheckoutPage;
    readonly inventoryPage: InventoryPage;
    readonly productDetailsPage: ProductDetailsPage;

    constructor(page: Page) {
        this.page = page;
        this.loginPage = new LoginPage(this.page);
        this.productsPage = new ProductsPage(this.page);
        this.cartPage = new CartPage(this.page);
        this.checkoutPage = new CheckoutPage(this.page);
        this.inventoryPage = new InventoryPage(this.page);
        this.productDetailsPage = new ProductDetailsPage(this.page);
    }
}
```

When you create a **new** page class, add it to `BaseSteps` following this pattern.

---

### Layer 4 — Fixtures (`tests/ui-tests/fixtures/pageFixtures.ts`)

Exposes Steps classes to specs via Playwright's `test.extend`. Add an entry for each new Steps class.

```typescript
// tests/ui-tests/fixtures/pageFixtures.ts  (add new entry, keep existing ones)
import { test as base } from '@playwright/test';
import ProductDetailsSteps from '../steps/productDetailsSteps';
// ... other imports

type PageFixtures = {
    productDetailsSteps: ProductDetailsSteps;
    // ... other fixtures
}

export const test = base.extend<PageFixtures>({
    productDetailsSteps: async ({ page }, use) => {
        const productDetailsSteps = new ProductDetailsSteps(page);
        await use(productDetailsSteps);
    },
    // ... other fixtures
});
```

---

### Layer 5 — Spec (`tests/ui-tests/specs/`)

Thin test file. Uses fixtures only — no page/step logic inline.

```typescript
// tests/ui-tests/specs/product-details.spec.ts
import { test } from '../fixtures/pageFixtures';

test.describe('Product Details', () => {

    test('Verify user can view product details for Sauce Labs Bolt T-Shirt', async ({ productDetailsSteps }) => {
        await productDetailsSteps.verifyProductDetailsPage('Sauce Labs Bolt T-Shirt');
    });

});
```

**Rules:**
- Import `test` from `../fixtures/pageFixtures`, not directly from `@playwright/test`.
- One `describe` block per feature area.
- Test names must read as plain English sentences describing the user outcome.
- No assertions, no locators, no `page.*` calls — delegate everything to the Steps class.

---

## Step 3 — Run the Test

```bash
test_env=test npx playwright test tests/ui-tests/specs/<spec-file>.spec.ts --config=config/playwright.config.ts --headed
```

Report the result. If it fails, diagnose the root cause and fix before finishing.
