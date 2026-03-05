import type { AutoFixReport, ResolvedAutoFixOptions } from './types';

export class FixReportPrinter {

    printReport(report: AutoFixReport, options: ResolvedAutoFixOptions): void {
        console.log('\n' + '='.repeat(80));
        console.log('🔧 TEST AUTO-FIX ANALYSIS REPORT');
        console.log('='.repeat(80));

        this.printSummary(report);

        if (report.fixSuggestions.length > 0) {
            this.printFixSuggestions(report, options);
        }

        if (report.redundancyPatterns.length > 0) {
            this.printRedundancy(report);
        }

        console.log('='.repeat(80));
        console.log(`Report generated at: ${new Date(report.summary.analysisTimestamp).toISOString()}`);
        console.log('='.repeat(80) + '\n');
    }

    private printSummary(report: AutoFixReport): void {
        const { summary } = report;

        console.log('\n📊 SUMMARY');
        console.log('-'.repeat(80));
        console.log(`Total failures analyzed: ${summary.totalFailures}`);
        console.log(`Fixable failures (high confidence): ${summary.fixableFail}`);
        console.log(`Redundant test patterns detected: ${summary.redundantTests}`);
    }

    private printFixSuggestions(report: AutoFixReport, options: ResolvedAutoFixOptions): void {
        console.log('\n🛠️  FIX SUGGESTIONS');
        console.log('-'.repeat(80));

        report.fixSuggestions.forEach((suggestion, index) => {
            const confidenceIcon = this.getConfidenceIcon(suggestion.confidence);
            const applicableIcon = suggestion.autoApplicable ? '✅' : '⚠️';

            console.log(`\n${confidenceIcon} Fix #${index + 1}: ${suggestion.title}`);
            console.log(`   File: ${suggestion.file}:${suggestion.line}`);
            console.log(`   Error Type: ${suggestion.errorType}`);
            console.log(`   Confidence: ${suggestion.confidence}%`);
            console.log(`   Auto-applicable: ${suggestion.autoApplicable ? 'Yes' : 'No'} ${applicableIcon}`);

            console.log(`\n   💡 Explanation:`);
            console.log(`   ${suggestion.explanation}`);

            console.log(`\n   📝 Suggested Fix:`);
            const fixLines = suggestion.suggestedFix.split('\n');
            fixLines.forEach(line => {
                console.log(`   ${line}`);
            });

            if (suggestion.confidence >= options.confidenceThreshold && suggestion.autoApplicable) {
                console.log(`\n   ⚡ This fix can be auto-applied (confidence >= ${options.confidenceThreshold}%)`);
            }
        });
    }

    private printRedundancy(report: AutoFixReport): void {
        console.log('\n🔍 REDUNDANT TEST PATTERNS');
        console.log('-'.repeat(80));

        report.redundancyPatterns.forEach((pattern, index) => {
            console.log(`\n${index + 1}. ${pattern.reason}`);
            console.log(`   Tests:`);
            pattern.testGroup.forEach(test => {
                console.log(`     • ${test}`);
            });
            console.log(`   💡 ${pattern.recommendation}`);
        });
    }

    private getConfidenceIcon(confidence: number): string {
        if (confidence >= 80) {
            return '🟢';
        } else if (confidence >= 60) {
            return '🟡';
        } else {
            return '🔴';
        }
    }
}
