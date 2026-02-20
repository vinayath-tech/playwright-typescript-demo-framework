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
            stack: topError?.stack
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

            const prompt = this.buildPrompt();
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

            if(!response.ok) {
                console.log(`[ai-failure-analysis] AI triage request failed with status ${response.status}: ${response.statusText}`);
                this.printLocalSummary();
                return;
            }

            const aiResult = (await response.json()) as {
                choices?: Array<{ message?: { content?: string} }>
            }

            const aiMessage = aiResult.choices?.[0].message?.content;
            if(!aiMessage) {
                console.log('[ai-failure-analysis] AI triage response did not contain a message');
                this.printLocalSummary();
                return;
            }

            console.log('=== AI Failure Analysis ===');
            console.log(aiMessage || 'No analysis returned from AI');
            console.log('===========================');

        } catch (error) {
            console.error('[ai-failure-analysis] Error during AI analysis:', error);
            this.printLocalSummary();
        }
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
}

export default AIFailureAnalysisReporter;