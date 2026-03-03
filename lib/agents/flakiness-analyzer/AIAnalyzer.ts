import type { FlakinessMetrics, FlakinessReport, ResolvedFlakinessOptions } from './types';

export class AIAnalyzer {
    private options: ResolvedFlakinessOptions;

    constructor(options: ResolvedFlakinessOptions) {
        this.options = options;
    }

    async analyzeFlakyTests(metrics: FlakinessMetrics[]): Promise<string[]> {
        if (!this.options.endpoint || !this.options.apiKey) {
            return this.generateLocalRecommendations(metrics);
        }

        try {
            const prompt = this.buildAnalysisPrompt(metrics);
            const response = await this.callAI(prompt);
            return this.parseRecommendations(response);
        } catch (error) {
            console.warn(`[flakiness-analyzer] AI analysis failed, using local analysis: ${error}`);
            return this.generateLocalRecommendations(metrics);
        }
    }

    private buildAnalysisPrompt(metrics: FlakinessMetrics[]): string {
        const flakyTests = metrics.filter(m => m.flakinessScore >= this.options.flakinessThreshold);

        let prompt = `Analyze the following flaky tests and provide actionable recommendations to fix them:\n\n`;

        flakyTests.slice(0, 10).forEach((metric, index) => {
            prompt += `Test ${index + 1}: ${metric.title}\n`;
            prompt += `  File: ${metric.file}\n`;
            prompt += `  Flakiness Score: ${metric.flakinessScore.toFixed(2)}/100\n`;
            prompt += `  Pass Rate: ${metric.passRate.toFixed(1)}%\n`;
            prompt += `  Total Runs: ${metric.totalRuns} (${metric.passCount} passed, ${metric.failCount} failed, ${metric.flakyCount} flaky)\n`;
            prompt += `  Max Retries: ${metric.maxRetries}\n`;
            prompt += `  Avg Duration: ${(metric.avgDuration / 1000).toFixed(2)}s\n`;

            if (metric.commonErrors.length > 0) {
                prompt += `  Common Errors:\n`;
                metric.commonErrors.forEach(err => {
                    prompt += `    - ${err}\n`;
                });
            }
            prompt += `\n`;
        });

        prompt += `\nProvide specific recommendations to reduce flakiness. Focus on:\n`;
        prompt += `1. Timing and wait strategies\n`;
        prompt += `2. Selector improvements\n`;
        prompt += `3. Test isolation issues\n`;
        prompt += `4. Environmental dependencies\n`;
        prompt += `5. Data dependencies\n\n`;
        prompt += `Format each recommendation as a bullet point with the test number referenced.`;

        return prompt;
    }

    private async callAI(prompt: string): Promise<string> {
        const payload = {
            model: this.options.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert QA automation engineer specializing in identifying and fixing flaky tests in Playwright test suites.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
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

        // Handle both /v1/chat/completions and /v1/responses formats
        if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content;
        } else if (data.content?.[0]?.text) {
            return data.content[0].text;
        }

        throw new Error('Unexpected API response format');
    }

    private parseRecommendations(aiResponse: string): string[] {
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const recommendations: string[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            // Match bullet points or numbered items
            if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
                recommendations.push(trimmed.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, ''));
            }
        });

        return recommendations.length > 0 ? recommendations : [aiResponse];
    }

    private generateLocalRecommendations(metrics: FlakinessMetrics[]): string[] {
        const recommendations: string[] = [];
        const flakyTests = metrics.filter(m => m.flakinessScore >= this.options.flakinessThreshold);

        if (flakyTests.length === 0) {
            return ['No flaky tests detected. Great job maintaining test stability!'];
        }

        recommendations.push(`Found ${flakyTests.length} flaky test(s). General recommendations:`);

        const highRetryTests = flakyTests.filter(t => t.maxRetries > 1);
        if (highRetryTests.length > 0) {
            recommendations.push(
                `${highRetryTests.length} test(s) require multiple retries. Consider:`,
                '  - Adding explicit waits for dynamic content',
                '  - Using waitForLoadState() and waitForSelector() with proper states',
                '  - Increasing timeout values for slow operations'
            );
        }

        const timeoutErrors = flakyTests.filter(t =>
            t.commonErrors.some(e => e.toLowerCase().includes('timeout'))
        );
        if (timeoutErrors.length > 0) {
            recommendations.push(
                `${timeoutErrors.length} test(s) have timeout errors:`,
                '  - Review network-dependent operations',
                '  - Consider mocking slow API calls',
                '  - Check for race conditions in async operations'
            );
        }

        const selectorErrors = flakyTests.filter(t =>
            t.commonErrors.some(e =>
                e.toLowerCase().includes('selector') ||
                e.toLowerCase().includes('element') ||
                e.toLowerCase().includes('locator')
            )
        );
        if (selectorErrors.length > 0) {
            recommendations.push(
                `${selectorErrors.length} test(s) have selector issues:`,
                '  - Use more resilient selectors (data-testid over CSS classes)',
                '  - Verify elements are in stable state before interaction',
                '  - Consider using page.waitForSelector() with state options'
            );
        }

        const criticallyFlaky = flakyTests.filter(t => t.flakinessScore >= this.options.criticalThreshold);
        if (criticallyFlaky.length > 0) {
            recommendations.push(
                `${criticallyFlaky.length} critically flaky test(s) detected:`,
                ...criticallyFlaky.map(t => `  - ${t.title} (${t.file}) - Score: ${t.flakinessScore.toFixed(1)}`)
            );
        }

        return recommendations;
    }
}
