import type { HealedLocator, SelfHealingConfig } from './types';

export class SelfHealingClient {

    constructor(private config: SelfHealingConfig) {}

    async getAlternativeLocators(
        pageSource: string,
        originalLocator: string,
        locatorType: string,
        pageUrl: string
    ): Promise<HealedLocator[]> {
        const prompt = this.buildPrompt(pageSource, originalLocator, locatorType, pageUrl);

        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                temperature: 0.1,
                instructions: 'You are a Playwright test automation expert specialising in resilient, stable locator strategies.',
                input: prompt
            })
        });

        if (!response.ok) {
            throw new Error(`[self-healing] AI request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as {
            output?: Array<{ content?: Array<{ text?: string }> }>
        };

        // const result = await response.json();
        const rawText = result.output?.[0]?.content?.[0]?.text ?? '';
        return this.parseResponse(rawText);
    }

    private buildPrompt(html: string, locator: string, locatorType: string, url: string): string {
        return [
            'A Playwright UI test failed because the following locator no longer matches any element on the page:',
            '',
            `  Locator Type : ${locatorType}`,
            `  Locator Value: ${locator}`,
            `  Page URL     : ${url}`,
            '',
            'Current page HTML (body content):',
            html,
            '',
            'Return a JSON array of up to 5 alternative Playwright-compatible locators that target the SAME element,',
            'ordered by confidence descending. Prefer stable attributes (data-test, id, aria-label) over fragile ones (class, index).',
            '',
            'Each item in the array must have exactly these fields:',
            '  "type"      : one of "css" | "xpath" | "text" | "role" | "testId"',
            '  "value"     : the locator string ready to pass directly into page.locator() or page.getByTestId()',
            '  "confidence": number between 0.0 and 1.0',
            '  "reasoning" : one sentence explaining why this locator targets the correct element',
            '',
            'IMPORTANT: Return ONLY a valid JSON array. No markdown, no code fences, no explanation outside the JSON.',
        ].join('\n');
    }

    private parseResponse(raw: string): HealedLocator[] {
        try {
            const cleaned = raw.replace(/```(?:json)?\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            console.warn('[self-healing] Failed to parse AI response as JSON:', raw.substring(0, 300));
            return [];
        }
    }
}
