import { existsSync, readFileSync } from 'node:fs';
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
  line: number;
  column: number;
  project: string;
  expectedStatus: TestResult['status'] | TestCase['expectedStatus'];
  actualStatus: TestResult['status'];
  durationMs: number;
  retry: number;
  errorMessage?: string;
  stack?: string;
  screenshots: string[];
};

type AiTriageReporterOptions = {
  endpoint?: string;
  model?: string;
  apiKey?: string;
  maxFailures?: number;
  includeScreenshots?: boolean;
  maxScreenshotsPerFailure?: number;
  maxScreenshotBytes?: number;
};

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail: 'low' } };

class AIFailureTriageReporter implements Reporter {
  private options: Required<AiTriageReporterOptions>;
  private failures: FailureRecord[] = [];

  constructor(options: AiTriageReporterOptions = {}) {
    this.options = {
      endpoint: options.endpoint || process.env.AI_TRIAGE_ENDPOINT || '',
      model: options.model || process.env.AI_TRIAGE_MODEL || 'gpt-4o-mini',
      apiKey: options.apiKey || process.env.AI_TRIAGE_API_KEY || '',
      maxFailures: options.maxFailures ?? Number(process.env.AI_TRIAGE_MAX_FAILURES || 20),
      includeScreenshots:
        options.includeScreenshots ?? process.env.AI_TRIAGE_INCLUDE_SCREENSHOTS === 'true',
      maxScreenshotsPerFailure:
        options.maxScreenshotsPerFailure ?? Number(process.env.AI_TRIAGE_MAX_SCREENSHOTS_PER_FAILURE || 1),
      maxScreenshotBytes:
        options.maxScreenshotBytes ?? Number(process.env.AI_TRIAGE_MAX_SCREENSHOT_BYTES || 500000),
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
      line: test.location.line,
      column: test.location.column,
      project: test.parent.project()?.name ?? 'unknown',
      expectedStatus: test.expectedStatus,
      actualStatus: result.status,
      durationMs: result.duration,
      retry: result.retry,
      errorMessage: topError?.message,
      stack: topError?.stack,
      screenshots: this.extractScreenshots(result),
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
      const userContent = this.buildUserContent();

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
              content: userContent,
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
      this.printFailureIndex();
      console.log(triage);
      console.log('=============================\n');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[ai-triage] Unexpected error while calling AI triage: ${message}`);
      this.printLocalSummary();
    }
  }

  private buildPrompt(): string {
    const payload = this.failures.map((failure) => ({
      ...failure,
      screenshotCount: failure.screenshots.length,
      screenshots: undefined,
    }));

    return [
      'Analyze these Playwright failures. For each failure provide:',
      '1) Root cause category (selector drift, timing/race, test data, auth/session, backend instability, assertion defect)',
      '2) Confidence score 0-100',
      '3) One concrete next debugging step',
      '',
      'Include the failure identifier in your answer using this format:',
      '[file:line] test title',
      '',
      'Failures:',
      JSON.stringify(payload, null, 2),
    ].join('\n');
  }

  private buildUserContent(): string | ContentPart[] {
    const textPrompt = this.buildPrompt();

    if (!this.options.includeScreenshots) {
      return textPrompt;
    }

    const screenshots = this.failures.flatMap((failure) =>
      failure.screenshots.slice(0, this.options.maxScreenshotsPerFailure),
    );

    if (!screenshots.length) {
      return textPrompt;
    }

    return [
      { type: 'text', text: textPrompt },
      ...screenshots.map((url) => ({
        type: 'image_url' as const,
        image_url: {
          url,
          detail: 'low' as const,
        },
      })),
    ];
  }

  private extractScreenshots(result: TestResult): string[] {
    if (!this.options.includeScreenshots) {
      return [];
    }

    const screenshotAttachments = result.attachments.filter(
      (attachment) => attachment.contentType?.startsWith('image/') || attachment.name?.includes('screenshot'),
    );

    const screenshots: string[] = [];

    for (const attachment of screenshotAttachments) {
      if (screenshots.length >= this.options.maxScreenshotsPerFailure) {
        break;
      }

      if (attachment.path && existsSync(attachment.path)) {
        const fileBuffer = readFileSync(attachment.path);
        if (fileBuffer.length <= this.options.maxScreenshotBytes) {
          screenshots.push(`data:${attachment.contentType ?? 'image/png'};base64,${fileBuffer.toString('base64')}`);
        }
        continue;
      }

      if (attachment.body && attachment.body.length <= this.options.maxScreenshotBytes) {
        screenshots.push(
          `data:${attachment.contentType ?? 'image/png'};base64,${attachment.body.toString('base64')}`,
        );
      }
    }

    return screenshots;
  }

  private printFailureIndex() {
    console.log('[ai-triage] Failed tests:');
    for (const failure of this.failures) {
      console.log(`- [${failure.file}:${failure.line}] ${failure.title}`);
      if (failure.screenshots.length) {
        console.log(`  screenshots attached to AI request: ${failure.screenshots.length}`);
      }
    }
    console.log('');
  }

  private printLocalSummary() {
    console.log('\n[ai-triage] Local failure summary:');
    for (const failure of this.failures) {
      console.log(`- [${failure.file}:${failure.line}] ${failure.title}`);
      console.log(`  actual vs expected: ${failure.actualStatus} vs ${failure.expectedStatus}`);
      if (failure.errorMessage) {
        console.log(`  error: ${failure.errorMessage.split('\n')[0]}`);
      }
      if (failure.screenshots.length) {
        console.log(`  screenshots captured: ${failure.screenshots.length}`);
      }
    }
    console.log('');
  }
}

export default AIFailureTriageReporter;
