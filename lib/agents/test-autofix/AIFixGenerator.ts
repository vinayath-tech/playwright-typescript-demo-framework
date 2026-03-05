import type { AutoFixSuggestion, ResolvedAutoFixOptions, ErrorType } from './types';

export class AIFixGenerator {
    private options: ResolvedAutoFixOptions;

    constructor(options: ResolvedAutoFixOptions) {
        this.options = options;
    }

    async generateFix(
        testTitle: string,
        file: string,
        errorType: ErrorType,
        errorMessage: string,
        codeContext: string
    ): Promise<AutoFixSuggestion | null> {

        if (!this.options.endpoint || !this.options.apiKey) {
            return this.generateLocalFix(testTitle, file, errorType, errorMessage, codeContext);
        }

        try {
            const prompt = this.buildFixPrompt(testTitle, file, errorType, errorMessage, codeContext);
            const response = await this.callAI(prompt);
            return this.parseSuggestion(testTitle, file, errorType, response);
        } catch (error) {
            console.warn(`[test-autofix] AI fix generation failed: ${error}`);
            return this.generateLocalFix(testTitle, file, errorType, errorMessage, codeContext);
        }
    }

    private buildFixPrompt(
        testTitle: string,
        file: string,
        errorType: ErrorType,
        errorMessage: string,
        codeContext: string
    ): string {
        let prompt = `You are an expert Playwright test engineer. A test is failing and needs to be fixed.\n\n`;
        prompt += `Test: ${testTitle}\n`;
        prompt += `File: ${file}\n`;
        prompt += `Error Type: ${errorType}\n\n`;
        prompt += `Error Message:\n${errorMessage}\n\n`;
        prompt += `Code Context:\n${codeContext}\n\n`;

        prompt += `Provide a fix suggestion with the following format:\n`;
        prompt += `SUGGESTED_FIX:\n[exact code to replace the problematic line(s)]\n\n`;
        prompt += `EXPLANATION:\n[brief explanation of why this fixes the issue]\n\n`;
        prompt += `CONFIDENCE:\n[number from 0-100 indicating confidence this will fix the issue]\n\n`;
        prompt += `AUTO_APPLICABLE:\n[yes/no - whether this can be automatically applied safely]\n`;

        return prompt;
    }

    private async callAI(prompt: string): Promise<string> {
        const payload = {
            model: this.options.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Playwright test engineer who fixes failing tests with precision and clarity.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 1500
        };

        const response = await fetch(this.options.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.options.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`AI API returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content;
        } else if (data.content?.[0]?.text) {
            return data.content[0].text;
        }

        throw new Error('Unexpected API response format');
    }

    private parseSuggestion(
        testTitle: string,
        file: string,
        errorType: ErrorType,
        aiResponse: string
    ): AutoFixSuggestion {

        const suggestedFixMatch = aiResponse.match(/SUGGESTED_FIX:\s*([\s\S]*?)(?=\n\nEXPLANATION:|$)/i);
        const explanationMatch = aiResponse.match(/EXPLANATION:\s*([\s\S]*?)(?=\n\nCONFIDENCE:|$)/i);
        const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*(\d+)/i);
        const autoApplicableMatch = aiResponse.match(/AUTO_APPLICABLE:\s*(yes|no)/i);

        const suggestedFix = suggestedFixMatch?.[1]?.trim() || 'No fix suggested';
        const explanation = explanationMatch?.[1]?.trim() || 'No explanation provided';
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
        const autoApplicable = autoApplicableMatch?.[1]?.toLowerCase() === 'yes';

        return {
            testId: `${file}:${testTitle}`,
            title: testTitle,
            file,
            line: 0,
            errorType,
            suggestedFix,
            explanation,
            confidence,
            autoApplicable
        };
    }

    private generateLocalFix(
        testTitle: string,
        file: string,
        errorType: ErrorType,
        errorMessage: string,
        codeContext: string
    ): AutoFixSuggestion {

        let suggestedFix = '';
        let explanation = '';
        let confidence = 60;

        switch (errorType) {
            case 'selector_issue':
                suggestedFix = `// Add proper wait before interaction\nawait page.waitForSelector('your-selector', { state: 'visible', timeout: 10000 });\n// Or use more resilient selector with data-testid`;
                explanation = 'Selector issues often occur when elements are not ready. Use explicit waits and stable selectors like data-testid.';
                confidence = 70;
                break;

            case 'timeout':
                suggestedFix = `// Increase timeout and add explicit wait\nawait page.waitForLoadState('networkidle');\nawait page.waitForTimeout(1000); // if absolutely necessary`;
                explanation = 'Timeout issues can be resolved by waiting for stable page states or increasing timeouts for slow operations.';
                confidence = 65;
                break;

            case 'assertion_failure':
                suggestedFix = `// Review assertion logic\n// Consider using soft assertions or retry logic\nawait expect(element).toHaveText('expected text', { timeout: 5000 });`;
                explanation = 'Assertion failures may need conditional logic or dynamic expected values based on test state.';
                confidence = 55;
                break;

            case 'network_error':
                suggestedFix = `// Mock network requests or add retry logic\nawait page.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));`;
                explanation = 'Network errors can be mitigated by mocking flaky endpoints or adding retry mechanisms.';
                confidence = 60;
                break;

            case 'race_condition':
                suggestedFix = `// Add proper synchronization\nawait page.waitForLoadState('domcontentloaded');\nawait page.waitForSelector('selector', { state: 'attached' });`;
                explanation = 'Race conditions need proper synchronization points to ensure stable element states.';
                confidence = 65;
                break;

            default:
                suggestedFix = `// Review test logic and add appropriate waits\n// Check for environmental dependencies\n// Consider test isolation`;
                explanation = 'Unknown error type. Manual investigation needed to determine root cause.';
                confidence = 40;
        }

        return {
            testId: `${file}:${testTitle}`,
            title: testTitle,
            file,
            line: 0,
            errorType,
            suggestedFix,
            explanation,
            confidence,
            autoApplicable: false
        };
    }
}
