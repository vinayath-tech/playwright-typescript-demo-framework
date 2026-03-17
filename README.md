# AI-Assisted Playwright TypeScript Test Automation Framework

A production-grade UI and API test automation framework built with [Playwright](https://playwright.dev/) and TypeScript. It implements the **Page Object Model (POM)** pattern and integrates three AI-powered capabilities: natural language test generation, intelligent failure analysis, and self-healing locators.

**Applications under test:**
- UI: [https://www.saucedemo.com](https://www.saucedemo.com) — e-commerce demo site
- API: [https://restful-booker.herokuapp.com](https://restful-booker.herokuapp.com) — hotel booking REST API

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [AI Features](#ai-features)
  - [AI-Assisted Test Generation](#1-ai-assisted-test-generation)
  - [Intelligent Failure Analysis](#2-intelligent-failure-analysis)
  - [Self-Healing Locators](#3-self-healing-locators)
- [Architecture](#architecture)
- [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later
- An [OpenAI API key](https://platform.openai.com/api-keys) *(only required for AI features)*
- [Claude Code](https://claude.ai/code) CLI *(only required for AI-assisted test generation)*

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/playwright-typescript-demo-framework.git
cd playwright-typescript-demo-framework
```

### 2. Install dependencies

```bash
npm install
npx playwright install --with-deps chromium
```

### 3. Configure environment variables

Copy the example below and create `env/.env.test`:

```bash
# UI test credentials (saucedemo.com)
UI_VALID_USERNAME="standard_user"
UI_VALID_PASSWORD="secret_sauce"
UI_INVALID_USERNAME="invalid_ui_user"
UI_INVALID_PASSWORD="invalid_ui_pass"

# API test credentials (restful-booker.herokuapp.com)
API_VALID_USERNAME="admin"
API_VALID_PASSWORD="password123"
API_INVALID_USERNAME="invalidUser"
API_INVALID_PASSWORD="invalidPass"

# AI Failure Analysis (optional — leave blank to disable)
AI_TRIAGE_ENDPOINT="https://api.openai.com/v1/responses"
AI_TRIAGE_API_KEY="sk-proj-..."
AI_TRIAGE_MODEL="gpt-4o"

# Self-Healing Locators (optional — leave blank to disable)
SELF_HEALING_ENABLED=true
SELF_HEALING_AI_ENDPOINT="https://api.openai.com/v1/responses"
SELF_HEALING_AI_KEY="sk-proj-..."
SELF_HEALING_AI_MODEL="gpt-4o"
SELF_HEALING_PAGE_FACTORY_DIR="tests/ui-tests/pageFactory"
SELF_HEALING_CACHE_PATH="artifacts/self-healing/healed-locators.json"
SELF_HEALING_MODE=review
SELF_HEALING_QUEUE_PATH="artifacts/self-healing/pending-review.json"
```

> AI features are optional. Tests run without any API keys — just omit or leave blank the AI-related vars.

### 4. Run the tests

```bash
npm run test:ui   # UI tests
npm run test:api  # API tests
```

---

## Project Structure

```
playwright-typescript-demo-framework/
├── config/
│   ├── playwright.config.ts          # UI test configuration
│   └── playwright.api.config.ts      # API test configuration
├── tests/
│   ├── ui-tests/
│   │   ├── specs/                    # Test cases
│   │   ├── pageFactory/              # Page objects (locators + UI actions)
│   │   ├── steps/                    # Business logic (extends BaseSteps)
│   │   ├── fixtures/pageFixtures.ts  # Playwright fixture extensions
│   │   ├── common/
│   │   │   ├── webActions.ts         # Playwright wrapper with self-healing
│   │   │   └── self-healing/         # Self-healing locator engine
│   │   └── helpers/pa11yHelper.ts    # Accessibility helpers
│   └── api-tests/                    # REST API test cases
├── lib/
│   ├── env.ts                        # Typed env variable loader
│   ├── global-setup.ts               # Global test setup
│   └── reporters/ai-failure-analysis/ # AI triage reporter
├── scripts/
│   └── review-heals.ts               # Interactive CLI for reviewing healed locators
├── artifacts/
│   └── self-healing/
│       ├── healed-locators.json      # Persistent healing cache
│       └── pending-review.json       # Review queue
├── docs/
│   └── ai-failure-triage.md
├── prompts/
│   └── ui-test-instructions.md       # AI test generation instructions
└── env/
    └── .env.test                     # Environment variables (not committed)
```

---

## Running Tests

| Command | Description |
|---|---|
| `npm run test:ui` | Run all UI tests (headless) |
| `npm run test:api` | Run all API tests |
| `npm run test:accessibility` | Run accessibility tests only |
| `npm run test:ui:ai-triage` | UI tests with AI failure analysis enabled |
| `npm run test:api:ai-triage` | API tests with AI failure analysis enabled |
| `npm run heal:review` | Interactively review pending self-healed locators |

**Run a specific spec file:**

```bash
npx playwright test tests/ui-tests/specs/checkout.spec.ts --config=config/playwright.config.ts
```

**Run headed (visible browser):**

```bash
npx playwright test --config=config/playwright.config.ts --headed
```

**Authentication:** The `auth.setup.ts` project runs first and saves a login session to `playwright/.auth/userAuth.json`. All subsequent tests reuse this session via Playwright's `storageState` — no per-test login needed.

---

## AI Features

### 1. AI-Assisted Test Generation

Describe what you want to test in plain English and the framework will:

1. Launch a real Chrome browser and perform the manual journey step by step
2. Capture locators and interactions automatically
3. Generate a fully structured TypeScript test following the POM pattern used in this project
4. Run the generated test to verify it passes

**Requirements:** [Claude Code CLI](https://claude.ai/code) installed and authenticated.

**How to use:**

Open your terminal in the project root with Claude Code active, then type:

```
/ui-test verify that a user can add a product to the cart and proceed to checkout
```

Claude Code will:
- Open `https://www.saucedemo.com` in a headed Chrome browser
- Walk through the scenario using `playwright-cli`
- Generate the Page, Steps, Fixture, and Spec files following the project's POM architecture
- Run the new test and report the result

**What gets generated (example for a new feature):**

```
tests/ui-tests/pageFactory/newFeaturePage.ts   ← locators + low-level actions
tests/ui-tests/steps/newFeatureSteps.ts        ← business logic + assertions
tests/ui-tests/fixtures/pageFixtures.ts        ← updated with new fixture
tests/ui-tests/specs/new-feature.spec.ts       ← thin test file
```

The generation prompt is defined in [prompts/ui-test-instructions.md](prompts/ui-test-instructions.md) and enforces the same conventions as the existing codebase.

---

### 2. Intelligent Failure Analysis

When tests fail, an AI reporter automatically analyses each failure and prints a root cause summary directly in the terminal — no manual log digging required.

**How it works:**

1. The custom reporter ([lib/reporters/ai-failure-analysis/](lib/reporters/ai-failure-analysis/)) collects all unexpected failures during the run.
2. At the end of the run it sends each failure to the configured LLM, including:
   - Test title and file location
   - Error message and stack trace
   - Failure screenshot (optional, for visual failures)
3. The model classifies the root cause (selector drift, timing, test data, auth, backend, assertion) and suggests a next debugging step.
4. The analysis is printed as an **AI FAILURE TRIAGE** block in the terminal.

**Enable it:**

```bash
# Runs tests and sends failures to the AI for triage
npm run test:ui:ai-triage
npm run test:api:ai-triage

# Or set the cap manually
AI_TRIAGE_MAX_FAILURES=10 npm run test:ui
```

**Enable screenshot analysis (multimodal models):**

```bash
AI_TRIAGE_INCLUDE_SCREENSHOTS=true npm run test:ui:ai-triage
```

**Required environment variables:**

```env
AI_TRIAGE_ENDPOINT="https://api.openai.com/v1/responses"
AI_TRIAGE_API_KEY="sk-proj-..."
AI_TRIAGE_MODEL="gpt-4o"
AI_TRIAGE_MAX_FAILURES=20                    # optional, default: 20
AI_TRIAGE_INCLUDE_SCREENSHOTS=false          # optional, default: false
```

> If these variables are not set, the reporter falls back to a plain local summary with no AI calls.

---

### 3. Self-Healing Locators

When a UI locator breaks (e.g., a `data-test` attribute is renamed or a CSS class changes), the framework detects the failure at runtime, asks the AI for alternative locators, validates them against the live DOM, and either patches the source file automatically or queues the fix for human review.

**How it works:**

1. Every interaction goes through [WebActions](tests/ui-tests/common/webActions.ts), which wraps Playwright calls.
2. If a locator times out, `WebActions` hands the broken selector and the current page HTML to the [SelfHealingEngine](tests/ui-tests/common/self-healing/SelfHealingEngine.ts).
3. The engine calls the AI (via [SelfHealingClient](tests/ui-tests/common/self-healing/SelfHealingClient.ts)) and receives up to 5 alternative locators with confidence scores.
4. Each alternative is validated against the live DOM.
5. The winning locator is cached to `artifacts/self-healing/healed-locators.json` so it is reused on future runs without another AI call.
6. Depending on `SELF_HEALING_MODE`:
   - **`auto`** — patches the `pageFactory/` source file immediately
   - **`review`** — adds a proposal to `artifacts/self-healing/pending-review.json` for a human to approve

**Review mode workflow:**

```bash
# 1. Run tests — broken locators are queued, not auto-patched
SELF_HEALING_MODE=review npm run test:ui

# 2. Review and approve / reject proposals interactively
npm run heal:review
```

The review CLI shows each proposal with the broken locator, suggested fix, confidence score, reasoning, and source file location. Approved proposals are patched into the source file on the spot.

**Example healed locator (from cache):**

```json
{
  "[data-test=\"ad-to-cart-sauce-labs-backpack\"]": "[data-test=\"add-to-cart-sauce-labs-backpack\"]"
}
```

**Required environment variables:**

```env
SELF_HEALING_ENABLED=true
SELF_HEALING_AI_ENDPOINT="https://api.openai.com/v1/responses"
SELF_HEALING_AI_KEY="sk-proj-..."
SELF_HEALING_AI_MODEL="gpt-4o"
SELF_HEALING_MODE=review                          # "auto" or "review"
SELF_HEALING_PAGE_FACTORY_DIR="tests/ui-tests/pageFactory"
SELF_HEALING_CACHE_PATH="artifacts/self-healing/healed-locators.json"
SELF_HEALING_QUEUE_PATH="artifacts/self-healing/pending-review.json"
```

> Set `SELF_HEALING_ENABLED=false` (or omit the variable) to run without self-healing.

---

## Architecture

```
Spec  →  Steps  →  Page Objects  →  WebActions  →  SelfHealingEngine
                                         ↑
                               (wraps all Playwright calls)
```

| Layer | Location | Responsibility |
|---|---|---|
| Spec | `tests/ui-tests/specs/` | Thin test files using fixtures |
| Steps | `tests/ui-tests/steps/` | Business logic + assertions, extends `BaseSteps` |
| Page Objects | `tests/ui-tests/pageFactory/` | Locators + raw UI interactions via `WebActions` |
| Fixtures | `tests/ui-tests/fixtures/pageFixtures.ts` | Exposes Steps classes to specs |
| WebActions | `tests/ui-tests/common/webActions.ts` | Playwright wrapper with self-healing support |
| Self-Healing | `tests/ui-tests/common/self-healing/` | AI-powered locator repair engine |
| AI Reporter | `lib/reporters/ai-failure-analysis/` | Post-run failure triage via LLM |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `UI_VALID_USERNAME` | Yes | Valid saucedemo.com username |
| `UI_VALID_PASSWORD` | Yes | Valid saucedemo.com password |
| `UI_INVALID_USERNAME` | Yes | Invalid username for negative tests |
| `UI_INVALID_PASSWORD` | Yes | Invalid password for negative tests |
| `API_VALID_USERNAME` | Yes | Valid restful-booker username |
| `API_VALID_PASSWORD` | Yes | Valid restful-booker password |
| `AI_TRIAGE_ENDPOINT` | No | LLM endpoint for failure analysis |
| `AI_TRIAGE_API_KEY` | No | API key for failure analysis |
| `AI_TRIAGE_MODEL` | No | Model to use (default: `gpt-4o`) |
| `AI_TRIAGE_MAX_FAILURES` | No | Max failures to analyse (default: 20) |
| `AI_TRIAGE_INCLUDE_SCREENSHOTS` | No | Send screenshots to LLM (default: false) |
| `SELF_HEALING_ENABLED` | No | Enable self-healing (default: false) |
| `SELF_HEALING_AI_ENDPOINT` | No | LLM endpoint for locator healing |
| `SELF_HEALING_AI_KEY` | No | API key for locator healing |
| `SELF_HEALING_AI_MODEL` | No | Model to use (default: `gpt-4o`) |
| `SELF_HEALING_MODE` | No | `auto` or `review` (default: `review`) |
| `SELF_HEALING_PAGE_FACTORY_DIR` | No | Path to pageFactory directory |
| `SELF_HEALING_CACHE_PATH` | No | Path for healed locator cache |
| `SELF_HEALING_QUEUE_PATH` | No | Path for review queue |
