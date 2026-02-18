# AI failure triage for Playwright tests

This framework includes a custom Playwright reporter that summarizes flaky/failed tests with AI.

## What was added

- Reporter file: `lib/reporters/ai-triage-reporter.ts`
- Reporter wired into:
  - `config/playwright.config.ts`
  - `config/playwright.api.config.ts`

## Improvements in terminal output

The `AI FAILURE TRIAGE` section now prints a failure index before the model output, including:

- failed test title
- file path + line number (`[file:line]`)
- screenshot attachment count (when enabled)

## How it works

1. During a test run, the reporter collects unexpected failures in `onTestEnd`.
2. At the end of the run (`onEnd`), it builds a compact prompt with:
   - test title path
   - file path + line/column
   - expected vs actual status
   - retry count
   - top error message and stack
3. If AI env vars are present, it sends the payload to your LLM endpoint.
4. If AI env vars are missing, it prints a local summary only.

## Environment variables

```bash
export AI_TRIAGE_ENDPOINT="https://api.openai.com/v1/chat/completions"
export AI_TRIAGE_API_KEY="your_api_key"
export AI_TRIAGE_MODEL="gpt-4o-mini"               # optional
export AI_TRIAGE_MAX_FAILURES="20"                  # optional

# Optional image support (for multimodal models)
export AI_TRIAGE_INCLUDE_SCREENSHOTS="true"         # default: false
export AI_TRIAGE_MAX_SCREENSHOTS_PER_FAILURE="1"    # default: 1
export AI_TRIAGE_MAX_SCREENSHOT_BYTES="500000"      # default: 500000 (~500KB)
```

## Example usage

Run existing suites as usual:

```bash
npm run test:ui
npm run test:api
```

When failures occur, you'll get an **AI FAILURE TRIAGE** section in terminal output.

## Screenshot support for LLMs

Yes, you can send failed-test screenshots to the model.

- This reporter can attach screenshot images as data URLs in the chat payload.
- Enable it via `AI_TRIAGE_INCLUDE_SCREENSHOTS=true`.
- Use a multimodal-capable model.
- Keep size limits low to avoid request bloat and cost spikes.

## Windows compatibility

The `test:*:ai-triage` npm scripts use `cross-env`, so env vars work on macOS/Linux and Windows shells.

## Notes

- Keep secrets out of prompt content.
- Keep model temperature low for deterministic debugging suggestions.
- You can point `AI_TRIAGE_ENDPOINT` to your internal AI gateway if needed.
