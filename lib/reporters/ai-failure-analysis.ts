import * as fs from 'fs';
import * as path from 'path';
import type {
    FullConfig,
    FullResult,
    Reporter,
    TestCase,
    TestResult,
  } from '@playwright/test/reporter';


type FailureRecord = {
    title: string,
    file: string,
    line: number,
    column: number,
    project: string,
    expectedStatus: TestResult['status'] | TestCase['expectedStatus'],
    actualStatus: TestResult['status'],
    durationMs: number,
    retry: number,
    errorMessage?: string,
    stack?: string,
    screenshotBase64?: string,
    screenshotMimeType?: string
}

type AiTriageReporterOptions = {
    endpoint?: string,
    model?: string,
    apiKey?: string,
    maxFailures?: number
}

class AIFailureAnalysisReporter implements Reporter {

    private options: Required<AiTriageReporterOptions>;
    private failures: FailureRecord[] = [];

    constructor(options: AiTriageReporterOptions) {
        this.options = {
            endpoint: options.endpoint || process.env.AI_TRIAGE_ENDPOINT || '',
            model: options.model || process.env.AI_TRIAGE_MODEL || 'gpt-4o',
            apiKey: options.apiKey || process.env.AI_TRIAGE_API_KEY || '',
            maxFailures: options.maxFailures ?? Number(process.env.AI_TRIAGE_MAX_FAILURES || 20)
        }
    }

    onBegin(_:FullConfig) {
        console.log(`AI Failure analysis reporter enabled`);
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        if(result.status === test.expectedStatus ||this.failures.length >= this.options.maxFailures) 
        {
            return;
        }

        const topError =  result.errors?.[0];

        const {screenshotBase64, mimeType} = this.extractScreenshot(test, result);

        this.failures.push({
            title: test.titlePath().join(' > '),
            file: test.location.file,
            line: test.location.line,
            column: test.location.column,
            project: test.parent.project()?.name ?? 'unknown',
            expectedStatus: test.expectedStatus,
            actualStatus: result.status,
            durationMs: result.duration,
            retry: result.retry,
            errorMessage: topError?.message,
            stack: topError?.stack,
            screenshotBase64,
            screenshotMimeType: mimeType
        });
    }

    async onEnd(_: FullResult) {

        if(!this.failures.length) {
            console.log('[ai-failure-analysis] No failures to analyze. Great job!');
            this.printLocalSummary();
            return;
        }

        if(!this.options.endpoint || !this.options.apiKey) {
            console.warn('[ai-failure-analysis] Missing endpoint or API key. Cannot perform AI analysis.');
            this.printLocalSummary();
            return;
        }

        try {

            const visualFailures = this.failures.filter(f => f.screenshotBase64);
            const textOnlyFailures = this.failures.filter(f => !f.screenshotBase64);

            for(const failure of visualFailures) {
                await this.analyseVisualFailure(failure);
            }

            if(textOnlyFailures.length > 0) {
                await this.analyseTextFailures(textOnlyFailures);
            }

        } catch (error) {
            console.error('[ai-failure-analysis] Error during AI analysis:', error);
            this.printLocalSummary();
        }
    }

    private async analyseVisualFailure(failure: FailureRecord): Promise<void> {
        const label = `[${path.basename(failure.file)}:${failure.line}] ${failure.title}`;

        try {
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
                                    text: this.buildVisualPrompt(failure)
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

            if(!response.ok) {
                console.log(`[ai-failure-analysis] Visual analysis for ${label} failed with status ${response.status}: ${response.statusText}`);
                return
            }

            const aiResult = (await response.json()) as {
                choices?: Array<{ message?: { content?: string } }>
            };
            
            const aiMessage = aiResult.choices?.[0].message?.content;

            console.log(`=== AI Visual Analysis for ${label} ===`);
            console.log(aiMessage || 'No analysis returned from AI');
            console.log('========================================');
            
        } catch (error) {
            console.error(`[ai-failure-analysis] Error during visual analysis for ${label}:`, error);
        }
    }

    private async analyseTextFailures(failure: FailureRecord[]): Promise<void> { 

        try{

                const prompt = this.buildPrompt();
                const response = await fetch(this.options.endpoint, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
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

                if(!response.ok) {
                    console.log(`[ai-failure-analysis] Text analysis request failed with status ${response.status}: ${response.statusText}`);
                    return;
                }

                const aiResult = (await response.json()) as {
                    choices?: Array<{ message?: { content?: string } }>
                };
            
                const aiMessage = aiResult.choices?.[0].message?.content;

                console.log('=== AI Textual Analysis ===');
                console.log(aiMessage || 'No analysis returned from AI');
                console.log('============================');
        }
        catch (error) {
            console.error('[ai-failure-analysis] Error during text analysis:', error);
        }
   }

    private buildVisualPrompt(failure: FailureRecord): string {
        return [
            'Analyze this Playwright UI test failure using both the screenshot and the error details below.',
            '',
            `Test       : ${failure.title}`,
            `File       : ${failure.file}:${failure.line}`,
            `Project    : ${failure.project}`,
            `Status     : expected "${failure.expectedStatus}" but got "${failure.actualStatus}"`,
            `Duration   : ${failure.durationMs}ms`,
            `Retry      : ${failure.retry}`,
            `Error      : ${failure.errorMessage ?? 'N/A'}`,
            '',
            'Using the screenshot, provide:',
            '1) What you VISUALLY observe on the screen (error banners, messages, wrong page, popups, CAPTCHA, empty states)',
            '2) Root cause category (e.g. auth failure, selector drift, wrong page loaded, validation error, network error)',
            '3) Most likely root cause combining visual evidence + error message (2-3 sentences)',
            '4) Confidence score (0-100)',
            '5) One concrete next debugging step',
        ].join('\n');
    }

    private buildPrompt(): String{
        return [
            'Analyze these Playwright test failures. For each failure, provide:',
            '1) Root cause category (e.g. selector drift, timing/race condition, test data issue, auth/session problem, backend instability, assertion defect)',
            '2) A brief explanation of the most likely root cause (1-2 sentences)',
            '3) A confidence score (0-100)',
            '4) One concrete next debugging step',
            '',
            'Include the failure identifier in your answer using this format:',
            '[file:line] test title',
            '',
            'Failures:',
            JSON.stringify(this.failures, null, 2)
        ].join('\n');
    }   

    private printLocalSummary() {
        console.log('\n[ai-triage] Local failure summary:');
        for (const failure of this.failures) {
        console.log(`- [${failure.file}:${failure.line}] ${failure.title}`);
        console.log(`  actual vs expected: ${failure.actualStatus} vs ${failure.expectedStatus}`);
        if (failure.errorMessage) {
            console.log(`  error: ${failure.errorMessage.split('\n')[0]}`);
        }
        }
        console.log('');
    }

    private extractScreenshot(test: TestCase, result: TestResult): {screenshotBase64?: string, mimeType?: string} {

        const screenshotAttachment = result.attachments?.find(
            att => att.name === 'screenshot' && att.contentType.startsWith('image/')
        );

        if(!screenshotAttachment){
            return {};
        }

        try{
            if(screenshotAttachment.body) {
                return {
                    screenshotBase64: screenshotAttachment.body.toString('base64'),
                    mimeType: screenshotAttachment.contentType
                };
            }

            if(screenshotAttachment.path && fs.existsSync(screenshotAttachment.path)) {
                const fileBuffer = fs.readFileSync(screenshotAttachment.path);
                return {
                    screenshotBase64: fileBuffer.toString('base64'),
                    mimeType: screenshotAttachment.contentType
                };
            }

        } catch (error) {
            console.warn(`[ai-failure-analysis] Failed to read screenshot for ${test.title}`, error);
        }

        return {};
    };

}

export default AIFailureAnalysisReporter;