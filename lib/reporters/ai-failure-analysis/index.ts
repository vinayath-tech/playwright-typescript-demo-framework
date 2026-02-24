import type {
    FullConfig,
    FullResult,
    Reporter,
    TestCase,
    TestResult,
} from '@playwright/test/reporter';

import type { AiTriageReporterOptions, FailureRecord, ResolvedOptions } from './types';
import { ScreenshotExtractor } from './ScreenshotExtractor';
import { AIClient } from './AIClient';
import { FailurePrinter } from './FailurePrinter';

class AIFailureAnalysisReporter implements Reporter {

    private options: ResolvedOptions;
    private failures: FailureRecord[] = [];

    // Injected dependencies
    private screenshotExtractor: ScreenshotExtractor;
    private aiClient: AIClient;
    private printer: FailurePrinter;

    constructor(options: AiTriageReporterOptions = {}) {
        this.options = {
            endpoint: options.endpoint || process.env.AI_TRIAGE_ENDPOINT || '',
            model: options.model || process.env.AI_TRIAGE_MODEL || 'gpt-4o',
            apiKey: options.apiKey || process.env.AI_TRIAGE_API_KEY || '',
            maxFailures: options.maxFailures ?? Number(process.env.AI_TRIAGE_MAX_FAILURES || 20)
        };

        this.screenshotExtractor = new ScreenshotExtractor();
        this.aiClient = new AIClient(this.options);
        this.printer = new FailurePrinter();
    }

    onBegin(_: FullConfig): void {
        console.log('[ai-failure-analysis] Reporter enabled');
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        if (result.status === test.expectedStatus || this.failures.length >= this.options.maxFailures) {
            return;
        }

        const topError = result.errors?.[0];
        const { screenshotBase64, mimeType } = this.screenshotExtractor.extract(test, result);

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

    async onEnd(_: FullResult): Promise<void> {
        if (!this.failures.length) {
            console.log('[ai-failure-analysis] No failures to analyze. Great job!');
            return;
        }

        if (!this.options.endpoint || !this.options.apiKey) {
            console.warn('[ai-failure-analysis] Missing endpoint or API key.');
            this.printer.printLocalSummary(this.failures);
            return;
        }

        try {
            const visualFailures = this.failures.filter(f => f.screenshotBase64);
            const textOnlyFailures = this.failures.filter(f => !f.screenshotBase64);

            for (const failure of visualFailures) {
                try {
                    const analysis = await this.aiClient.analyseVisualFailure(failure);
                    this.printer.printVisualAnalysis(failure, analysis);
                } catch (error) {
                    this.printer.printVisualAnalysisError(failure, error);
                }
            }

            if (textOnlyFailures.length > 0) {
                const analysis = await this.aiClient.analyseTextFailures(textOnlyFailures);
                this.printer.printTextAnalysis(analysis);
            }

        } catch (error) {
            console.error('[ai-failure-analysis] Error during AI analysis:', error);
            this.printer.printLocalSummary(this.failures);
        }
    }
}

export default AIFailureAnalysisReporter;