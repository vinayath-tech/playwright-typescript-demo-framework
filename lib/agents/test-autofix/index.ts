import type {
    FullConfig,
    FullResult,
    Reporter,
    TestCase,
    TestResult,
} from '@playwright/test/reporter';

import type { AutoFixAgentOptions, AutoFixReport, AutoFixSuggestion, ResolvedAutoFixOptions } from './types';
import { FailurePatternDetector } from './FailurePatternDetector';
import { AIFixGenerator } from './AIFixGenerator';
import { RedundancyDetector } from './RedundancyDetector';
import { FixReportPrinter } from './FixReportPrinter';

class TestAutoFixReporter implements Reporter {

    private options: ResolvedAutoFixOptions;
    private detector: FailurePatternDetector;
    private fixGenerator: AIFixGenerator;
    private redundancyDetector: RedundancyDetector;
    private printer: FixReportPrinter;

    private failures: Array<{
        test: TestCase,
        result: TestResult
    }> = [];

    constructor(options: AutoFixAgentOptions = {}) {
        this.options = {
            endpoint: options.endpoint || process.env.AUTOFIX_AI_ENDPOINT || '',
            model: options.model || process.env.AUTOFIX_AI_MODEL || 'gpt-4o',
            apiKey: options.apiKey || process.env.AUTOFIX_AI_API_KEY || '',
            autoApply: options.autoApply ?? (process.env.AUTOFIX_AUTO_APPLY === 'true'),
            confidenceThreshold: options.confidenceThreshold ?? Number(process.env.AUTOFIX_CONFIDENCE_THRESHOLD || 80),
            analyzeRedundancy: options.analyzeRedundancy ?? (process.env.AUTOFIX_ANALYZE_REDUNDANCY !== 'false')
        };

        this.detector = new FailurePatternDetector();
        this.fixGenerator = new AIFixGenerator(this.options);
        this.redundancyDetector = new RedundancyDetector();
        this.printer = new FixReportPrinter();
    }

    onBegin(_: FullConfig): void {
        console.log('[test-autofix] Analyzing test failures for auto-fix suggestions');
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        if (result.status !== test.expectedStatus) {
            this.failures.push({ test, result });
        }
    }

    async onEnd(_: FullResult): Promise<void> {
        if (this.failures.length === 0) {
            console.log('[test-autofix] No failures to analyze. All tests passed!');
            return;
        }

        const fixSuggestions: AutoFixSuggestion[] = [];

        // Generate fix suggestions for each failure
        for (const { test, result } of this.failures) {
            const errorMessage = result.errors?.[0]?.message || 'Unknown error';
            const stack = result.errors?.[0]?.stack;

            const errorType = this.detector.detectErrorType(errorMessage, stack);
            const codeContext = this.detector.extractRelevantCode(
                test.location.file,
                test.location.line
            );

            const suggestion = await this.fixGenerator.generateFix(
                test.titlePath().join(' > '),
                test.location.file,
                errorType,
                errorMessage,
                codeContext
            );

            if (suggestion) {
                suggestion.line = test.location.line;
                fixSuggestions.push(suggestion);
            }
        }

        // Detect redundant tests if enabled
        const redundancyPatterns = this.options.analyzeRedundancy
            ? this.detectRedundancy()
            : [];

        const report: AutoFixReport = {
            summary: {
                totalFailures: this.failures.length,
                fixableFail: fixSuggestions.filter(s => s.confidence >= this.options.confidenceThreshold).length,
                redundantTests: redundancyPatterns.length,
                analysisTimestamp: Date.now()
            },
            fixSuggestions,
            redundancyPatterns
        };

        this.printer.printReport(report, this.options);
    }

    private detectRedundancy(): any[] {
        // This is a simplified implementation
        // In a real scenario, you'd scan all test files
        const redundancies = this.redundancyDetector.detectRedundantTests([]);

        return redundancies.map(r => ({
            testGroup: r.tests,
            file: 'multiple',
            reason: r.reason,
            recommendation: 'Consider consolidating these tests or ensuring they test distinct scenarios'
        }));
    }
}

export default TestAutoFixReporter;
