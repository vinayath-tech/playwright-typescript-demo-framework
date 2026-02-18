import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

type FailureRecord = {
  title: string;
  file: string;
  project: string;
  expectedStatus: TestResult['status'] | TestCase['expectedStatus'];
  actualStatus: TestResult['status'];
  durationMs: number;
  retry: number;
  errorMessage?: string;
  stack?: string;
};

type AiTriageReporterOptions = {
  endpoint?: string;
  model?: string;
  apiKey?: string;
  maxFailures?: number;
};

class AIFailureTriageReporter implements Reporter {
  private options: Required<AiTriageReporterOptions>;
  private failures: FailureRecord[] = [];

  constructor(options: AiTriageReporterOptions = {}) {
    this.options = {
      endpoint: options.endpoint || process.env.AI_TRIAGE_ENDPOINT || '',
      model: options.model || process.env.AI_TRIAGE_MODEL || 'gpt-4o-mini',
      apiKey: options.apiKey || process.env.AI_TRIAGE_API_KEY || '',
      maxFailures: options.maxFailures ?? Number(process.env.AI_TRIAGE_MAX_FAILURES || 20),
    };
  }

  onBegin(_: FullConfig) {
    console.log('[ai-triage] Reporter enabled.');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === test.expectedStatus) {
      return;
    }

    if (this.failures.length >= this.options.maxFailures) {
      return;
    }

    const topError = result.errors?.[0];

    this.failures.push({
      title: test.titlePath().join(' > '),
      file: test.location.file,
      project: test.parent.project()?.name ?? 'unknown',
      expectedStatus: test.expectedStatus,
      actualStatus: result.status,
      durationMs: result.duration,
      retry: result.retry,
      errorMessage: topError?.message,
      stack: topError?.stack,
    });
  }

  async onEnd(_: FullResult) {
    if (!this.failures.length) {
      console.log('[ai-triage] No failed tests detected.');
      return;
    }

    if (!this.options.endpoint || !this.options.apiKey) {
      console.log(
        '[ai-triage] Skipping AI triage. Set AI_TRIAGE_ENDPOINT and AI_TRIAGE_API_KEY to enable.',
      );
      this.printLocalSummary();
      return;
    }

    try {
      const prompt = this.buildPrompt();

      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior QA engineer. Classify root causes for flaky/failed tests and provide the next best debugging actions.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.log(`[ai-triage] AI request failed: ${response.status} ${response.statusText}`);
        this.printLocalSummary();
        return;
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const triage = json.choices?.[0]?.message?.content;
      if (!triage) {
        console.log('[ai-triage] AI response did not contain triage output.');
        this.printLocalSummary();
        return;
      }

      console.log('\n===== AI FAILURE TRIAGE =====');
      console.log(triage);
      console.log('=============================\n');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[ai-triage] Unexpected error while calling AI triage: ${message}`);
      this.printLocalSummary();
    }
  }

  private buildPrompt(): string {
    return [
      'Analyze these Playwright failures. For each failure provide:',
      '1) Root cause category (selector drift, timing/race, test data, auth/session, backend instability, assertion defect)',
      '2) Confidence score 0-100',
      '3) One concrete next debugging step',
      '',
      'Failures:',
      JSON.stringify(this.failures, null, 2),
    ].join('\n');
  }

  private printLocalSummary() {
    console.log('\n[ai-triage] Local failure summary:');
    for (const failure of this.failures) {
      console.log(`- ${failure.title}`);
      console.log(`  file: ${failure.file}`);
      console.log(`  actual vs expected: ${failure.actualStatus} vs ${failure.expectedStatus}`);
      if (failure.errorMessage) {
        console.log(`  error: ${failure.errorMessage.split('\n')[0]}`);
      }
    }
    console.log('');
  }
}

export default AIFailureTriageReporter;
