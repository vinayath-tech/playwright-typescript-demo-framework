# AI Intelligence Examples

This directory contains example usage patterns for the AI agents.

## Quick Examples

### 1. Running Flakiness Analysis

```bash
# Basic flakiness tracking (no AI)
npm run test:ui:flakiness

# With AI-powered recommendations
export FLAKINESS_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export FLAKINESS_AI_API_KEY="your-key"
export FLAKINESS_AI_MODEL="gpt-4o"
npm run test:ui:flakiness
```

### 2. Running Auto-Fix Analysis

```bash
# Basic auto-fix suggestions (no AI)
npm run test:ui:autofix

# With AI-powered fix generation
export AUTOFIX_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export AUTOFIX_AI_API_KEY="your-key"
export AUTOFIX_AI_MODEL="gpt-4o"
npm run test:ui:autofix
```

### 3. Running All AI Features Together

```bash
# Run tests with all AI features enabled
export FLAKINESS_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export FLAKINESS_AI_API_KEY="your-key"
export AUTOFIX_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export AUTOFIX_AI_API_KEY="your-key"
export AI_TRIAGE_ENDPOINT="https://api.openai.com/v1/responses"
export AI_TRIAGE_API_KEY="your-key"

# Run UI tests with flakiness tracking
npm run test:ui:flakiness

# Then run with auto-fix to get suggestions
npm run test:ui:autofix

# Check the reports:
# - Flakiness: .playwright-test-history/test-history.json
# - Auto-fix: Console output with suggestions
```

## Example Workflow for CI/CD

```yaml
name: AI-Enhanced Testing

on: [push, pull_request]

jobs:
  test-with-ai:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run tests with flakiness tracking
        env:
          FLAKINESS_AI_ENDPOINT: ${{ secrets.OPENAI_ENDPOINT }}
          FLAKINESS_AI_API_KEY: ${{ secrets.OPENAI_KEY }}
          FLAKINESS_AI_MODEL: gpt-4o
        run: npm run test:ui:flakiness
        continue-on-error: true

      - name: Run tests with auto-fix suggestions
        env:
          AUTOFIX_AI_ENDPOINT: ${{ secrets.OPENAI_ENDPOINT }}
          AUTOFIX_AI_API_KEY: ${{ secrets.OPENAI_KEY }}
          AUTOFIX_AI_MODEL: gpt-4o
        run: npm run test:ui:autofix
        continue-on-error: true

      - name: Upload test history
        uses: actions/upload-artifact@v3
        with:
          name: test-history
          path: .playwright-test-history/

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Sample Output

### Flakiness Report Example
```
================================================================================
🔍 FLAKINESS ANALYSIS REPORT
================================================================================

📊 SUMMARY
--------------------------------------------------------------------------------
Total tests analyzed: 15
Flaky tests found: 2
  🔴 Critical: 1
  🟠 Moderate: 1
  🟡 Mild: 0

🔧 FLAKY TESTS DETAILS
--------------------------------------------------------------------------------

🔴 Test #1: Checkout flow > should complete purchase successfully
   File: tests/ui-tests/specs/checkout.spec.ts
   Flakiness Score: 62.30/100
   Pass Rate: 65.0% (13/20)
   Failures: 7, Flaky passes: 4
   Max retries: 2
   Avg duration: 3.45s
   Common errors:
     • Timeout 30000ms exceeded waiting for selector [data-testid="complete"]

🟠 Test #2: Product sorting > should sort by price ascending
   File: tests/ui-tests/specs/sorting.spec.ts
   Flakiness Score: 45.20/100
   Pass Rate: 80.0% (16/20)
   Failures: 4, Flaky passes: 2
   Max retries: 1
   Avg duration: 1.23s

💡 RECOMMENDATIONS
--------------------------------------------------------------------------------
• Test #1: Add explicit wait for network idle state before checking completion
• Test #1: Consider using waitForLoadState('networkidle') after form submission
• Test #2: Ensure all product prices are loaded before asserting sort order
• General: 2 test(s) have timeout errors - review network operations
```

### Auto-Fix Report Example
```
================================================================================
🔧 TEST AUTO-FIX ANALYSIS REPORT
================================================================================

📊 SUMMARY
--------------------------------------------------------------------------------
Total failures analyzed: 3
Fixable failures (high confidence): 2
Redundant test patterns detected: 0

🛠️  FIX SUGGESTIONS
--------------------------------------------------------------------------------

🟢 Fix #1: Checkout flow > should complete purchase successfully
   File: tests/ui-tests/specs/checkout.spec.ts:34
   Error Type: timeout
   Confidence: 85%
   Auto-applicable: Yes ✅

   💡 Explanation:
   The test times out waiting for the order completion confirmation. This is
   likely due to network delay. Adding an explicit wait for network idle
   before checking for the success message will resolve this issue.

   📝 Suggested Fix:
   // Add network wait before checking for completion
   await page.waitForLoadState('networkidle', { timeout: 15000 });
   await page.waitForSelector('[data-testid="complete"]', {
     state: 'visible',
     timeout: 10000
   });
   await expect(page.locator('[data-testid="complete"]')).toBeVisible();

   ⚡ This fix can be auto-applied (confidence >= 80%)

🟡 Fix #2: Product sorting > should sort by price ascending
   File: tests/ui-tests/specs/sorting.spec.ts:23
   Error Type: assertion_failure
   Confidence: 70%
   Auto-applicable: No ⚠️

   💡 Explanation:
   The assertion fails because not all product prices have loaded when the
   check occurs. Wait for all price elements to be stable before asserting.

   📝 Suggested Fix:
   // Wait for all prices to load
   await page.waitForSelector('.inventory_item_price', {
     state: 'attached',
     timeout: 5000
   });

   // Get all price elements
   const priceElements = page.locator('.inventory_item_price');
   const count = await priceElements.count();

   // Verify all prices are visible
   for (let i = 0; i < count; i++) {
     await priceElements.nth(i).waitFor({ state: 'visible' });
   }

   // Now safely check sorting
   const prices = await priceElements.allTextContents();
   const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));
   const sorted = [...numericPrices].sort((a, b) => a - b);
   expect(numericPrices).toEqual(sorted);
```

## Troubleshooting

### No AI recommendations?
The agents work with or without AI! If AI is not configured, you'll get:
- **Flakiness Analyzer**: Local heuristic-based recommendations
- **Auto-Fix Agent**: Pattern-based fix suggestions

### Want to test without AI?
Simply don't set the AI environment variables and run:
```bash
npm run test:ui:flakiness  # Will use local analysis
npm run test:ui:autofix    # Will use pattern detection
```

## Additional Resources

- [Full AI Agents Documentation](../docs/ai-agents.md)
- [AI Failure Triage Guide](../docs/ai-failure-triage.md)
- [Main README](../README.md)
