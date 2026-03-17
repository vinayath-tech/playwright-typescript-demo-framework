import type { VisualComparisonResult, VisualTestingConfig } from './types';

/**
 * Sends baseline and actual screenshots to an LLM vision model and returns
 * a structured comparison result.
 *
 * The model receives both images in the same request with a detailed prompt
 * asking it to identify layout shifts, text changes, missing/new elements,
 * colour changes, and any other visible regressions.
 */
export class VisualTestingClient {

    constructor(private config: VisualTestingConfig) {}

    async compareScreenshots(
        baselineBuffer: Buffer,
        actualBuffer: Buffer,
        snapshotName: string,
        pageUrl: string
    ): Promise<VisualComparisonResult> {
        const baselineBase64 = baselineBuffer.toString('base64');
        const actualBase64   = actualBuffer.toString('base64');
        const prompt = this.buildPrompt(snapshotName, pageUrl);

        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                temperature: 0.1,
                instructions: 'You are a visual regression testing expert. Analyse screenshots objectively and identify meaningful UI differences that would constitute a regression.',
                input: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'input_text',
                                text: prompt
                            },
                            {
                                type: 'input_image',
                                image_url: `data:image/png;base64,${baselineBase64}`,
                                detail: 'high'
                            },
                            {
                                type: 'input_image',
                                image_url: `data:image/png;base64,${actualBase64}`,
                                detail: 'high'
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`[visual-testing] AI request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as {
            output?: Array<{ content?: Array<{ text?: string }> }>
        };

        const rawText = result.output?.[0]?.content?.[0]?.text ?? '';
        return this.parseResponse(rawText);
    }

    private buildPrompt(snapshotName: string, pageUrl: string): string {
        return [
            'Compare these two screenshots to detect meaningful UI changes for visual regression testing.',
            '',
            `  Snapshot Name : ${snapshotName}`,
            `  Page URL      : ${pageUrl}`,
            '',
            'The FIRST image is the BASELINE (the approved reference state).',
            'The SECOND image is the ACTUAL (the current state being tested).',
            '',
            'Analyse for:',
            '  1. Layout changes — element positions, sizes, alignment, spacing',
            '  2. Text changes — content, font, colour, size, truncation',
            '  3. Missing or new elements — buttons, icons, labels, images',
            '  4. Colour or style changes — backgrounds, borders, shadows',
            '  5. Any other visible differences that would indicate a UI regression',
            '',
            'Ignore: sub-pixel rendering differences, anti-aliasing artefacts, and minor browser font-hinting variations.',
            '',
            'Return a JSON object with exactly these fields:',
            '  "isMatch"       : boolean — true if the screenshots are visually equivalent for regression purposes',
            '  "confidence"    : number 0.0–1.0 — how confident you are in this assessment',
            '  "diffRegions"   : array of objects for each detected change (empty array when isMatch is true)',
            '                    Each object must have:',
            '                      "description" : string describing what changed',
            '                      "severity"    : "minor" | "moderate" | "major"',
            '                      "location"    : string (optional) — approximate area, e.g. "header", "cart button"',
            '  "summary"       : one sentence summarising the overall comparison result',
            '  "recommendation": "pass" | "fail" | "review"',
            '',
            'IMPORTANT: Return ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.',
        ].join('\n');
    }

    private parseResponse(raw: string): VisualComparisonResult {
        try {
            const cleaned = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned) as VisualComparisonResult;
        } catch {
            console.warn('[visual-testing] Failed to parse AI response as JSON:', raw.substring(0, 300));
            // Conservative fallback — surface for human review rather than silently passing
            return {
                isMatch: false,
                confidence: 0,
                diffRegions: [],
                summary: 'AI response could not be parsed — manual review required.',
                recommendation: 'review'
            };
        }
    }
}
