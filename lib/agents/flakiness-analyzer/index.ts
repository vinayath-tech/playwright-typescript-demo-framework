import type {
    FullConfig,
    FullResult,
    Reporter,
    TestCase,
    TestResult,
} from '@playwright/test/reporter';

import type { FlakinessAnalyzerOptions, FlakinessReport, ResolvedFlakinessOptions, TestRunRecord } from './types';
import { HistoryTracker } from './HistoryTracker';
import { AIAnalyzer } from './AIAnalyzer';
import { ReportPrinter } from './ReportPrinter';

class FlakinessAnalyzerReporter implements Reporter {

    private options: ResolvedFlakinessOptions;
    private historyTracker: HistoryTracker;
    private aiAnalyzer: AIAnalyzer;
    private printer: ReportPrinter;

    constructor(options: FlakinessAnalyzerOptions = {}) {
        this.options = {
            historyFile: options.historyFile || '.playwright-test-history/test-history.json',
            endpoint: options.endpoint || process.env.FLAKINESS_AI_ENDPOINT || '',
            model: options.model || process.env.FLAKINESS_AI_MODEL || 'gpt-4o',
            apiKey: options.apiKey || process.env.FLAKINESS_AI_API_KEY || '',
            flakinessThreshold: options.flakinessThreshold ?? Number(process.env.FLAKINESS_THRESHOLD || 20),
            criticalThreshold: options.criticalThreshold ?? Number(process.env.FLAKINESS_CRITICAL_THRESHOLD || 60),
            moderateThreshold: options.moderateThreshold ?? Number(process.env.FLAKINESS_MODERATE_THRESHOLD || 40)
        };

        this.historyTracker = new HistoryTracker(this.options.historyFile);
        this.aiAnalyzer = new AIAnalyzer(this.options);
        this.printer = new ReportPrinter();
    }

    onBegin(_: FullConfig): void {
        console.log('[flakiness-analyzer] Tracking test execution for flakiness analysis');
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        const testId = `${test.location.file}:${test.titlePath().join(' > ')}`;

        const record: TestRunRecord = {
            testId,
            title: test.titlePath().join(' > '),
            file: test.location.file,
            line: test.location.line,
            project: test.parent.project()?.name ?? 'unknown',
            status: result.status,
            duration: result.duration,
            retry: result.retry,
            timestamp: Date.now(),
            errorMessage: result.errors?.[0]?.message
        };

        this.historyTracker.addTestRun(record);
    }

    async onEnd(_: FullResult): Promise<void> {
        // Save the history first
        this.historyTracker.saveHistory();

        // Calculate flakiness metrics
        const allMetrics = this.historyTracker.getAllFlakinessMetrics();

        // Filter to tests that meet the flakiness threshold
        const flakyTests = allMetrics.filter(m => m.flakinessScore >= this.options.flakinessThreshold);

        // Categorize by severity
        const criticallyFlaky = flakyTests.filter(t => t.flakinessScore >= this.options.criticalThreshold);
        const moderatelyFlaky = flakyTests.filter(
            t => t.flakinessScore >= this.options.moderateThreshold && t.flakinessScore < this.options.criticalThreshold
        );
        const mildlyFlaky = flakyTests.filter(
            t => t.flakinessScore >= this.options.flakinessThreshold && t.flakinessScore < this.options.moderateThreshold
        );

        // Get AI recommendations
        const recommendations = await this.aiAnalyzer.analyzeFlakyTests(allMetrics);

        const report: FlakinessReport = {
            summary: {
                totalTests: allMetrics.length,
                flakyTests: flakyTests.length,
                criticallyFlaky: criticallyFlaky.length,
                moderatelyFlaky: moderatelyFlaky.length,
                mildlyFlaky: mildlyFlaky.length,
                analysisTimestamp: Date.now()
            },
            flakyTests,
            recommendations
        };

        // Print the report
        this.printer.printReport(report, this.options);

        // Optionally prune old history (keep last 30 days)
        this.historyTracker.pruneOldHistory(30);
        this.historyTracker.saveHistory();
    }
}

export default FlakinessAnalyzerReporter;
