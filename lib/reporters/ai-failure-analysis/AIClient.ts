import type { FailureRecord, ResolvedOptions } from "./types";
import { PromptBuilder } from "./PromptBuilder";

export class AIClient {

    private promptBuilder: PromptBuilder;

    constructor(private options: ResolvedOptions) {
        this.promptBuilder = new PromptBuilder();
    }

    async analyseVisualFailure(failure: FailureRecord): Promise<string | undefined> {
        const response = await fetch(this.options.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.options.apiKey}`
            },
            body: JSON.stringify({
                model: this.options.model,
                temperature: 0.1,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior QA engineer. Analyze the attached screenshot from a failed test and identify likely causes of the failure based on visual cues. Provide a confidence score for each potential cause.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: this.promptBuilder.buildVisualPrompt(failure)
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${failure.screenshotMimeType};base64,${failure.screenshotBase64}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Visual analysis API call failed: ${response.status} ${response.statusText}`);
        }

        const aiResult = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>
        };

        return aiResult.choices?.[0].message?.content;
    }

    async analyseTextFailures(failure: FailureRecord[]): Promise<string | undefined> {
        const prompt = this.promptBuilder.buildPrompt(failure);
        const response = await fetch(this.options.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.options.apiKey}`
            },
            body: JSON.stringify({
                model: this.options.model,
                temperature: 0.1,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior QA engineer. Classify a detailed explanation of root causes for flaky/failed tests and provide the next best debugging actions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            console.log(`[ai-failure-analysis] Text analysis request failed with status ${response.status}: ${response.statusText}`);
            return;
        }

        const aiResult = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>
        };

        return aiResult.choices?.[0].message?.content;
    }
}
