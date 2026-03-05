# Playwright TypeScript Demo Framework with AI Intelligence

A comprehensive Playwright test automation framework featuring AI-powered test analysis, flakiness detection, and auto-fix capabilities.

## 🚀 Features

### Core Testing Framework
- ✅ **Page Object Model (POM)** - Clean, maintainable test architecture
- ✅ **Custom Fixtures** - Reusable step-based test components
- ✅ **UI & API Testing** - Comprehensive test coverage
- ✅ **Accessibility Testing** - Built-in axe-core integration
- ✅ **Docker Support** - Containerized test execution
- ✅ **CI/CD Ready** - GitHub Actions workflows included

### 🤖 AI Intelligence Features (NEW!)

#### 1. AI Failure Triage
- Analyzes test failures with visual and text-based AI models
- Provides root cause analysis and debugging steps
- Supports multimodal analysis (screenshots + error messages)

#### 2. Flakiness Analyzer Agent 🔍
- **Automatic tracking** of test execution history
- **Smart scoring** algorithm (0-100 scale)
- **Pattern detection** for common flaky test issues
- **AI recommendations** for fixing flaky tests
- **Trend analysis** over time

#### 3. Test Auto-Fix Agent 🔧
- **Intelligent error classification** (selector, timeout, assertion, etc.)
- **AI-powered fix suggestions** with confidence scores
- **Code context extraction** for better analysis
- **Redundancy detection** to identify duplicate tests
- **Auto-apply capability** for high-confidence fixes

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [AI Agents Usage](#ai-agents-usage)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Documentation](#documentation)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/vinayath-tech/playwright-typescript-demo-framework.git
cd playwright-typescript-demo-framework

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## ⚡ Quick Start

### Basic Test Execution

```bash
# Run UI tests
npm run test:ui

# Run API tests
npm run test:api

# Run accessibility tests
npm run test:accessibility
```

### AI-Enhanced Testing

```bash
# Run with AI failure triage
npm run test:ui:ai-triage

# Run with flakiness analysis
npm run test:ui:flakiness

# Run with auto-fix suggestions
npm run test:ui:autofix
```

## 🤖 AI Agents Usage

### 1. Flakiness Analyzer

Tracks test stability over time and identifies problematic tests.

```bash
# Enable flakiness analysis
export FLAKINESS_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export FLAKINESS_AI_API_KEY="your_api_key"
export FLAKINESS_AI_MODEL="gpt-4o"

# Run tests with flakiness tracking
npm run test:ui:flakiness
```

**What it does:**
- Maintains history of all test runs in `.playwright-test-history/`
- Calculates flakiness scores based on:
  - Pass/fail rate
  - Retry patterns
  - Result inconsistency
- Categorizes tests: Critical (60+), Moderate (40-60), Mild (20-40)
- Provides AI-powered recommendations to fix flakiness

**Example Output:**
```
🔍 FLAKINESS ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY
Total tests analyzed: 15
Flaky tests found: 3
  🔴 Critical: 1
  🟠 Moderate: 1
  🟡 Mild: 1

🔧 FLAKY TESTS DETAILS
🔴 Test #1: Login > should successfully log in
   Flakiness Score: 65.50/100
   Pass Rate: 70.0% (14/20)
   Common errors: Timeout waiting for selector...
```

### 2. Test Auto-Fix Agent

Analyzes failures and suggests fixes with confidence scores.

```bash
# Enable auto-fix agent
export AUTOFIX_AI_ENDPOINT="https://api.openai.com/v1/chat/completions"
export AUTOFIX_AI_API_KEY="your_api_key"
export AUTOFIX_AI_MODEL="gpt-4o"
export AUTOFIX_CONFIDENCE_THRESHOLD="80"

# Run tests with auto-fix
npm run test:ui:autofix
```

**What it does:**
- Detects error types (selector, timeout, assertion, network, etc.)
- Extracts relevant code context around failures
- Generates fix suggestions using AI or local heuristics
- Provides confidence scores (0-100)
- Identifies redundant or duplicate tests

**Example Output:**
```
🔧 TEST AUTO-FIX ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️  FIX SUGGESTIONS

🟢 Fix #1: Checkout > should complete purchase
   Error Type: timeout
   Confidence: 85% ✅

   💡 Explanation:
   Add explicit wait for network idle state

   📝 Suggested Fix:
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="complete"]');
```

### 3. AI Failure Triage (Existing)

Real-time AI analysis of test failures during execution.

```bash
# Configure AI triage
export AI_TRIAGE_ENDPOINT="https://api.openai.com/v1/responses"
export AI_TRIAGE_API_KEY="your_api_key"
export AI_TRIAGE_MODEL="gpt-4o"
export AI_TRIAGE_MAX_FAILURES="20"

# Run with AI triage
npm run test:ui:ai-triage
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.test` file:

```bash
# Test Credentials
UI_VALID_USERNAME=standard_user
UI_VALID_PASSWORD=secret_sauce
API_VALID_USERNAME=admin
API_VALID_PASSWORD=password123

# AI Failure Triage
AI_TRIAGE_ENDPOINT=https://api.openai.com/v1/responses
AI_TRIAGE_API_KEY=your_openai_key
AI_TRIAGE_MODEL=gpt-4o
AI_TRIAGE_MAX_FAILURES=20

# Flakiness Analyzer
FLAKINESS_AI_ENDPOINT=https://api.openai.com/v1/chat/completions
FLAKINESS_AI_API_KEY=your_openai_key
FLAKINESS_AI_MODEL=gpt-4o
FLAKINESS_THRESHOLD=20
FLAKINESS_CRITICAL_THRESHOLD=60
FLAKINESS_MODERATE_THRESHOLD=40

# Test Auto-Fix Agent
AUTOFIX_AI_ENDPOINT=https://api.openai.com/v1/chat/completions
AUTOFIX_AI_API_KEY=your_openai_key
AUTOFIX_AI_MODEL=gpt-4o
AUTOFIX_AUTO_APPLY=false
AUTOFIX_CONFIDENCE_THRESHOLD=80
AUTOFIX_ANALYZE_REDUNDANCY=true
```

### Playwright Configuration Files

- `playwright.config.ts` - Main UI test configuration
- `playwright.api.config.ts` - API test configuration
- `playwright.flakiness.config.ts` - Flakiness analyzer config
- `playwright.autofix.config.ts` - Auto-fix agent config

## 📁 Project Structure

```
playwright-typescript-demo-framework/
├── config/                              # Playwright configurations
│   ├── playwright.config.ts            # Main UI config
│   ├── playwright.api.config.ts        # API config
│   ├── playwright.flakiness.config.ts  # Flakiness analyzer
│   └── playwright.autofix.config.ts    # Auto-fix agent
├── tests/
│   ├── ui-tests/
│   │   ├── specs/                      # Test specifications
│   │   ├── steps/                      # Business logic layer
│   │   ├── pageFactory/                # Page objects
│   │   ├── fixtures/                   # Custom fixtures
│   │   └── common/                     # Shared utilities
│   └── api-tests/                      # API test suite
├── lib/
│   ├── reporters/
│   │   └── ai-failure-analysis/        # AI failure triage reporter
│   └── agents/
│       ├── flakiness-analyzer/         # Flakiness detection agent
│       └── test-autofix/               # Auto-fix suggestion agent
├── docs/
│   ├── ai-agents.md                    # AI agents documentation
│   └── ai-failure-triage.md           # Failure triage docs
└── .playwright-test-history/           # Test execution history (gitignore)
```

## 🧪 Running Tests

### Local Execution

```bash
# UI tests
npm run test:ui                    # Standard UI tests
npm run test:ui:ai-triage         # With AI failure analysis
npm run test:ui:flakiness         # With flakiness tracking
npm run test:ui:autofix           # With auto-fix suggestions

# API tests
npm run test:api                   # Standard API tests
npm run test:api:ai-triage        # With AI failure analysis
npm run test:api:flakiness        # With flakiness tracking
npm run test:api:autofix          # With auto-fix suggestions

# Accessibility tests
npm run test:accessibility         # Pa11y/Axe tests
```

### Docker Execution

```bash
# Build Docker image
npm run docker:build

# Run tests in Docker
npm run docker:run
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The framework includes pre-configured workflows:

```yaml
# .github/workflows/playwright.yml
jobs:
  test-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:api

  test-ui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:ui

  test-with-ai-analysis:
    runs-on: ubuntu-latest
    env:
      FLAKINESS_AI_ENDPOINT: ${{ secrets.OPENAI_ENDPOINT }}
      FLAKINESS_AI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:ui:flakiness
      - run: npm run test:ui:autofix
```

### Required Secrets

Add these to your GitHub repository secrets:

- `OPENAI_ENDPOINT` - Your AI API endpoint
- `OPENAI_API_KEY` - Your AI API key
- `UI_VALID_USERNAME` - Test user username
- `UI_VALID_PASSWORD` - Test user password
- `API_VALID_USERNAME` - API test username
- `API_VALID_PASSWORD` - API test password

## 📚 Documentation

- **[AI Agents Guide](docs/ai-agents.md)** - Complete guide to AI features
- **[AI Failure Triage](docs/ai-failure-triage.md)** - Failure analysis setup
- **[Copilot Skills](.copilot/skills/)** - GitHub Copilot integration

## 🏗️ Architecture

### Three-Layer Test Architecture

1. **Spec Layer** (`tests/ui-tests/specs/`)
   - Pure test orchestration
   - Uses fixtures for business logic
   - Minimal code, maximum readability

2. **Steps Layer** (`tests/ui-tests/steps/`)
   - Business logic and workflows
   - Orchestrates multiple page objects
   - Reusable test scenarios

3. **Page Layer** (`tests/ui-tests/pageFactory/`)
   - UI element interactions
   - No business logic
   - Single responsibility per page

### AI Agents Architecture

```
Reporter Layer (Playwright Integration)
    ↓
Agent Layer (Flakiness/AutoFix/Triage)
    ↓
Analysis Layer (Pattern Detection/Code Extraction)
    ↓
AI Layer (LLM Integration with Fallbacks)
    ↓
Output Layer (Report Generation)
```

## 🎯 Best Practices

### For Flakiness Analysis
1. Run in CI after every test execution
2. Track trends over time
3. Set quality gates (block PRs with critical flakiness)
4. Review and fix tests with scores > 60

### For Auto-Fix
1. Always review AI suggestions before applying
2. Start with `AUTOFIX_AUTO_APPLY=false`
3. Validate fixes with multiple test runs
4. Use suggestions to improve test patterns

### For AI Configuration
1. Use GPT-4o or Claude Sonnet for best results
2. Monitor API costs at scale
3. Implement caching for common patterns
4. Always have fallback logic (works without AI)

## 🔍 Troubleshooting

### Tests failing?
- Check environment variables in `.env.test`
- Verify credentials are correct
- Ensure Playwright browsers are installed

### AI not working?
- Verify `ENDPOINT` and `API_KEY` variables
- Check API quota and network connectivity
- Agents fall back to local heuristics if AI unavailable

### Flakiness not detected?
- Run tests multiple times to build history
- Lower `FLAKINESS_THRESHOLD` (default: 20)
- Check `.playwright-test-history/` directory exists

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/)
- AI integration supports OpenAI, Anthropic, and compatible APIs
- Inspired by modern test automation best practices

---

**Need help?** Check the [documentation](docs/) or open an issue.

**Want to contribute?** See [CONTRIBUTING.md](CONTRIBUTING.md) (if available).
