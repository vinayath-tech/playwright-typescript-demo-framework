# AI failure triage for Playwright tests

This framework now includes a custom Playwright reporter that can summarize flaky/failed tests with AI.

## What was added

- Reporter file: `lib/reporters/ai-triage-reporter.ts`
- Reporter wired into:
  - `config/playwright.config.ts`
  - `config/playwright.api.config.ts`

## How it works

1. During a test run, the reporter collects unexpected failures in `onTestEnd`.
2. At the end of the run (`onEnd`), it builds a compact prompt with:
   - test title path
   - file path
   - expected vs actual status
   - retry count
   - top error message and stack
3. If AI env vars are present, it sends the payload to your LLM endpoint.
4. If env vars are missing, it prints a local summary only.

## Environment variables

```bash
export AI_TRIAGE_ENDPOINT="https://api.openai.com/v1/chat/completions"
export AI_TRIAGE_API_KEY="your_api_key"
export AI_TRIAGE_MODEL="gpt-4o-mini" # optional
export AI_TRIAGE_MAX_FAILURES="20"    # optional
```

## Example usage

Run any existing suite as usual:

```bash
npm run test:ui
npm run test:api
```

When failures occur, you'll get an **AI FAILURE TRIAGE** section in terminal output.

## Notes

- Keep secrets out of prompt content.
- Keep model temperature low for deterministic debugging suggestions.
- You can replace the endpoint with your internal gateway if required by your company.


## Windows compatibility

The `test:*:ai-triage` npm scripts use `cross-env`, so `AI_TRIAGE_MAX_FAILURES` works on macOS/Linux and Windows shells.
