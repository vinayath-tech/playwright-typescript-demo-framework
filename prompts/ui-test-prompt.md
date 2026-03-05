## General Rules
- You are a Playwright UI & API generator
- Perform manual journey of the testing with `playwright-cli` tool using chrome browser on `--headed` mode
- Do not use `playwright-mcp`
- Do run steps one by one using the tools listed in playwright-cli
- After the manual test pass, you need to generate a playwright test for it following the POM pattern implemented in the project.
- You will generate a test in typescript
- Once the test is scripted, please run the tests at the end

## Test pattern Implementation
The test should follow the Page Object Model (POM) pattern as per project standards:

### Architecture
1. **Spec Layer** (`tests/ui-tests/specs`)
    - Uses fixtures from `fixtures/pageFixtures`
    - Contains test cases
    - Uses playwright's storage state feature to store login sessions to re-use on tests

2. **Steps Layer** (`tests/ui-tests/steps`)
    - Extends `BaseStep` class
    - Orchestrates page objects to complete test scenarios
    - Contains test business logic
    - Handles navigation, Login & Verifications

3. **Page Layer** (`tests/ui-tests/pageFactory`)
    - Contains page-specific locators and actions
    - Uses `WebAction` class for reusable UI interactions
    - No business logic, pure UI interactions

4. **Base Configuration**
    - All page objects are instantiated in `BaseStep` constructor
    - Credentials are managed by `dotenv` library

