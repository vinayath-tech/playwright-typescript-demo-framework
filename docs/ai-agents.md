# AI Agents for Intelligent Test Analysis

This framework includes AI-powered agents to enhance test automation with intelligent analysis and recommendations.

## Available AI Agents

### 1. Flakiness Analyzer Agent 🔍

Tracks test execution history over time and identifies flaky tests using advanced scoring algorithms.

#### Features
- **Historical tracking**: Maintains a database of all test runs
- **Flakiness scoring**: Calculates a 0-100 score based on:
  - Failure rate
  - Retry patterns
  - Result inconsistency (alternating pass/fail)
- **Severity categorization**: Critical (60+), Moderate (40-60), Mild (20-40)
- **AI-powered recommendations**: Get specific fixes from LLM models
- **Common error detection**: Groups similar failures together

#### Usage

```bash
# UI tests with flakiness analysis
npm run test:ui:flakiness

# API tests with flakiness analysis
npm run test:api:flakiness
```

#### Environment Variables

```bash
# Optional: AI-powered recommendations
export FLAKINESS_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export FLAKINESS_AI_API_KEY="your_api_key"
export FLAKINESS_AI_MODEL="gpt-4o"

# Thresholds (optional)
export FLAKINESS_THRESHOLD="20"           # Minimum score to flag as flaky
export FLAKINESS_CRITICAL_THRESHOLD="60"  # Critical flakiness threshold
export FLAKINESS_MODERATE_THRESHOLD="40"  # Moderate flakiness threshold
```

#### How It Works

1. **Test Execution**: Tracks every test run with status, duration, retry count, and errors
2. **History Storage**: Saves data to `.playwright-test-history/test-history.json`
3. **Analysis**: Calculates flakiness metrics after each run
4. **Reporting**: Displays detailed report with:
   - Summary statistics
   - Flaky test details
   - Common error patterns
   - AI-generated recommendations (if configured)

#### Example Output

```
================================================================================
🔍 FLAKINESS ANALYSIS REPORT
================================================================================

📊 SUMMARY
--------------------------------------------------------------------------------
Total tests analyzed: 15
Flaky tests found: 3
  🔴 Critical: 1
  🟠 Moderate: 1
  🟡 Mild: 1

🔧 FLAKY TESTS DETAILS
--------------------------------------------------------------------------------

🔴 Test #1: Login > should successfully log in with valid credentials
   File: tests/ui-tests/specs/login.spec.ts
   Flakiness Score: 65.50/100
   Pass Rate: 70.0% (14/20)
   Failures: 6, Flaky passes: 3
   Max retries: 2
   Avg duration: 2.34s
   Common errors:
     • Timeout 30000ms exceeded waiting for selector...

💡 RECOMMENDATIONS
--------------------------------------------------------------------------------
• Test #1: Add explicit wait for selector stability before interaction
• Consider using data-testid attributes for more resilient selectors
• Review timing issues - high retry count indicates race conditions
```

---

### 2. Test Auto-Fix Agent 🔧

Analyzes test failures and provides AI-powered fix suggestions with confidence scores.

#### Features
- **Error classification**: Categorizes failures into types:
  - Selector issues
  - Timeouts
  - Assertion failures
  - Network errors
  - Data dependencies
  - Race conditions
- **Code context extraction**: Shows relevant code around failures
- **AI fix generation**: Provides specific code fixes with explanations
- **Confidence scoring**: Rates fix suggestions from 0-100
- **Auto-apply capability**: Marks fixes that can be safely auto-applied
- **Redundancy detection**: Identifies duplicate or redundant tests

#### Usage

```bash
# UI tests with auto-fix suggestions
npm run test:ui:autofix

# API tests with auto-fix suggestions
npm run test:api:autofix
```

#### Environment Variables

```bash
# AI endpoint configuration
export AUTOFIX_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export AUTOFIX_AI_API_KEY="your_api_key"
export AUTOFIX_AI_MODEL="gpt-4o"

# Options
export AUTOFIX_AUTO_APPLY="false"              # Enable auto-apply (default: false)
export AUTOFIX_CONFIDENCE_THRESHOLD="80"       # Min confidence for auto-apply
export AUTOFIX_ANALYZE_REDUNDANCY="true"       # Detect redundant tests
```

#### How It Works

1. **Failure Collection**: Captures all test failures with full context
2. **Error Detection**: Classifies each failure into specific error types
3. **Code Extraction**: Retrieves relevant code snippets around failure points
4. **AI Analysis**: Generates fix suggestions using LLM (or local heuristics)
5. **Report Generation**: Presents actionable fixes with confidence levels

#### Example Output

```
================================================================================
🔧 TEST AUTO-FIX ANALYSIS REPORT
================================================================================

📊 SUMMARY
--------------------------------------------------------------------------------
Total failures analyzed: 5
Fixable failures (high confidence): 3
Redundant test patterns detected: 1

🛠️  FIX SUGGESTIONS
--------------------------------------------------------------------------------

🟢 Fix #1: Checkout > should complete purchase flow
   File: tests/ui-tests/specs/checkout.spec.ts:45
   Error Type: timeout
   Confidence: 85%
   Auto-applicable: Yes ✅

   💡 Explanation:
   The test times out waiting for the confirmation page. Add explicit wait
   for network idle state before checking for success message.

   📝 Suggested Fix:
   // Add network wait before assertion
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="order-complete"]', {
     state: 'visible',
     timeout: 10000
   });
   await expect(page.locator('[data-testid="order-complete"]')).toBeVisible();

   ⚡ This fix can be auto-applied (confidence >= 80%)

🟡 Fix #2: Product Sorting > should sort by price low to high
   File: tests/ui-tests/specs/sorting.spec.ts:23
   Error Type: assertion_failure
   Confidence: 65%
   Auto-applicable: No ⚠️

   💡 Explanation:
   Assertion failure suggests prices might not be fully loaded. Consider
   adding wait for stable state or checking actual values.

   📝 Suggested Fix:
   // Wait for all prices to load
   await page.waitForSelector('.inventory_item_price', { state: 'attached' });
   await page.waitForTimeout(500); // Allow rendering

   const prices = await page.locator('.inventory_item_price').allTextContents();
   const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));

   // Verify sorted order
   const sorted = [...numericPrices].sort((a, b) => a - b);
   expect(numericPrices).toEqual(sorted);

🔍 REDUNDANT TEST PATTERNS
--------------------------------------------------------------------------------

1. Similar test names detected (normalized: "login valid credentials")
   Tests:
     • tests/ui-tests/specs/login.spec.ts:Login with valid credentials
     • tests/ui-tests/specs/auth.spec.ts:Login with valid user
   💡 Consider consolidating these tests or ensuring they test distinct scenarios
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Playwright Tests with AI Analysis

on: [push, pull_request]

jobs:
  test-with-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with AI analysis
        env:
          FLAKINESS_AI_ENDPOINT: ${{ secrets.OPENAI_ENDPOINT }}
          FLAKINESS_AI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          AUTOFIX_AI_ENDPOINT: ${{ secrets.OPENAI_ENDPOINT }}
          AUTOFIX_AI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          npm run test:ui:flakiness
          npm run test:ui:autofix

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            playwright-report/
            .playwright-test-history/
```

---

## Combining Multiple Agents

You can use multiple reporters together for comprehensive analysis:

**Custom Config Example:**

```typescript
// config/playwright.full-analysis.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/ui-tests/specs',
  reporter: [
    ['list'],
    ['html'],
    ['../lib/reporters/ai-failure-analysis/index.ts'],      // Failure triage
    ['../lib/agents/flakiness-analyzer/index.ts'],          // Flakiness tracking
    ['../lib/agents/test-autofix/index.ts'],                // Auto-fix suggestions
  ],
  // ... rest of config
});
```

---

## Best Practices

### 1. Flakiness Analysis
- **Run regularly**: Execute flakiness analysis after every test run in CI
- **Track trends**: Monitor flakiness scores over time
- **Set thresholds**: Block PRs if critical flakiness is detected
- **Act on insights**: Prioritize fixing tests with scores above 60

### 2. Auto-Fix Suggestions
- **Review before applying**: Even high-confidence fixes should be reviewed
- **Start conservative**: Begin with `AUTOFIX_AUTO_APPLY=false`
- **Validate fixes**: Run tests multiple times after applying fixes
- **Learn patterns**: Use suggestions to improve test-writing practices

### 3. AI Configuration
- **Use appropriate models**: GPT-4o or Claude Sonnet for best results
- **Monitor costs**: AI analysis can be expensive at scale
- **Cache results**: Consider caching common failure patterns
- **Fallback logic**: Both agents work without AI (local heuristics)

---

## Data Storage

### Flakiness History
- **Location**: `.playwright-test-history/test-history.json`
- **Retention**: Last 30 days (configurable via code)
- **Format**: JSON array of test run records
- **Git**: Add to `.gitignore` or commit for team visibility

### Recommendations
- **Commit history**: For team-wide visibility of flaky tests
- **Ignore in local dev**: Add to `.gitignore` for personal experimentation

```bash
# .gitignore
.playwright-test-history/
```

Or keep it for CI:
```bash
# Commit the directory but keep it in CI artifacts
```

---

## Troubleshooting

### No AI recommendations?
- Check `ENDPOINT` and `API_KEY` environment variables
- Verify API endpoint format matches your provider
- Review network connectivity and API quotas
- Agents will fall back to local heuristics if AI unavailable

### Flakiness not detected?
- Run tests multiple times to build history
- Lower `FLAKINESS_THRESHOLD` (default: 20)
- Ensure test history file is being written
- Check file permissions on `.playwright-test-history/`

### Fix suggestions not helpful?
- Provide more context to AI via error messages
- Use better selectors and error handling in tests
- Increase model temperature for more creative suggestions
- Try different AI models (GPT-4, Claude, etc.)

---

## API Reference

### Flakiness Analyzer Options

```typescript
type FlakinessAnalyzerOptions = {
  historyFile?: string;              // Default: .playwright-test-history/test-history.json
  endpoint?: string;                 // AI endpoint URL
  model?: string;                    // AI model name (default: gpt-4o)
  apiKey?: string;                   // AI API key
  flakinessThreshold?: number;       // Default: 20
  criticalThreshold?: number;        // Default: 60
  moderateThreshold?: number;        // Default: 40
};
```

### Auto-Fix Agent Options

```typescript
type AutoFixAgentOptions = {
  endpoint?: string;                 // AI endpoint URL
  model?: string;                    // AI model name (default: gpt-4o)
  apiKey?: string;                   // AI API key
  autoApply?: boolean;               // Default: false
  confidenceThreshold?: number;      // Default: 80
  analyzeRedundancy?: boolean;       // Default: true
};
```

---

## Future Enhancements

Potential features for future versions:

- **Visual regression AI**: Analyze screenshot diffs with vision models
- **Test generation**: Auto-generate tests from user flows
- **Smart retry**: Dynamically adjust retry logic based on flakiness
- **Performance analysis**: Identify slow tests and optimization opportunities
- **Coverage gaps**: Suggest missing test scenarios
- **Self-healing tests**: Automatically update selectors when UI changes

---

## Contributing

Found a bug or have an enhancement idea? Please:
1. Check existing issues
2. Create detailed bug reports with examples
3. Submit PRs with tests
4. Update documentation

---

## License

This project follows the same license as the main repository.
