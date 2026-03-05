# Playwright TypeScript Demo Framework

## Project Overview
Playwright-based UI and API test automation framework using TypeScript. Tests follow the Page Object Model (POM) pattern.

## Architecture

- **Specs** — `tests/ui-tests/specs/` — Test cases using fixtures from `fixtures/pageFixtures`
- **Steps** — `tests/ui-tests/steps/` — Business logic extending `BaseSteps`
- **Pages** — `tests/ui-tests/pageFactory/` — Locators and UI interactions using `WebActions`
- **Fixtures** — `tests/ui-tests/fixtures/pageFixtures.ts` — Playwright test extensions
- **Config** — `config/playwright.config.ts`
- **Env** — `env/.env.test` (loaded via dotenv)

## Key Conventions
- All page objects are instantiated in `BaseSteps` constructor
- Auth is handled via `auth.setup.ts` and stored in `playwright/.auth/userAuth.json`
- `WebActions` wraps Playwright interactions — use it in page objects, not raw `page.*` calls
- Tests run with `storageState` (pre-authenticated) — no need to log in per test

## Running Tests
```bash
npx playwright test --config=config/playwright.config.ts
npx playwright test --config=config/playwright.config.ts --headed
npx playwright test --config=config/playwright.config.ts tests/ui-tests/specs/<file>.spec.ts
```
