---
name: api-test
description: Playwright API test generator. Use when asked to write, create, or generate API tests. Performs a manual API journey first using playwright-cli using REST client then generates a TypeScript Playwright test following the API Test pattern, and runs it.
disable-model-invocation: true
---

## General Rules
- You are a Playwright API test generator.
- Perform a manual journey of the test scenario using `playwright-cli` with REST Client
- Do NOT use `playwright-mcp`.
- Execute steps one by one using the playwright-cli tools.
- After the manual test passes, generate a Playwright test in TypeScript following the API Test pattern implemented in this project.
- Once the test is scripted, run it to verify it passes.

## Step 1 — Manual Test Journey

1. Use `curl` via the Bash tool to exercise the endpoint.
2. Execute the scenario step by step:
   - Send the request (GET/POST/PUT/DELETE) against the baseURL.
   - Print status code and response body.
   - Validate status, schema and field values against expectations.
3. Confirm the manual journey passes before proceeding.

---

## Step 2 — Automation Test Generation

Follow the API Test architecture used in this project.

Always read existing files in `tests/api-tests/` first to understand current patterns before generating any code.

---

### Layer 1 — Specs (`tests/api-tests/**.spec.ts`)

Holds API test logic which uses Playwright's request to send HTTP calls and verify API response

```typescript
// tests/api-tests/02-CreateBooking.spec.ts
test.describe('Create a new booking', () => {

    let bookingId: number;
    test('Valid booking creation', async ({ request }) => {

        const bookingResponse = await request.post('/booking', {
            data: bookingPayload
        });

        expect(bookingResponse.status()).toBe(200);

        const responseBody =  await bookingResponse.json();
        console.log('Booking Response Body:', responseBody);

        //Extract booking id
        bookingId = responseBody.bookingid;
        console.log('Created Booking ID:', bookingId);

        // Store bookingId in SharedState for use in other tests
        SharedState.setBookingId(bookingId);

        expect(responseBody).toHaveProperty('bookingid');
        expect(responseBody).toHaveProperty('booking');

        // Validate booking details
        const bookingDetails = responseBody.booking;
        expect(bookingDetails.firstname).toBe(bookingPayload.firstname);
        expect(bookingDetails.lastname).toBe(bookingPayload.lastname);
        expect(bookingDetails.totalprice).toBe(bookingPayload.totalprice);
    });
});
```

**Rules:**
- One file per Spec.
---

### Layer 2 — Payload test data (`testdata/`)

All the test payloads used for POST or any HTTP methods are derived in this folder

```typescript
// testdata/createBookingData.ts
import { faker } from '@faker-js/faker';


export const bookingPayload = {
    "firstname": "Gokul",
    "lastname": "Sridharan",
    "totalprice": 100,
    "depositpaid": true,
    "bookingdates": {
        "checkin": "2024-06-01",
        "checkout": "2024-06-10"
    },
    "additionalneeds": "Breakfast"
}
```

**Rules:**
- Create new constant for each payload

---


## Step 3 — Run the Test

```bash
cross-env test_env=test npx playwright test --config=config/playwright.api.config.ts
```

Report the result. If it fails, diagnose the root cause and fix before finishing.
