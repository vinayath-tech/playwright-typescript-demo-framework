import type { FlakinessReport, ResolvedFlakinessOptions } from './types';

export class ReportPrinter {

    printReport(report: FlakinessReport, options: ResolvedFlakinessOptions): void {
        console.log('\n' + '='.repeat(80));
        console.log('🔍 FLAKINESS ANALYSIS REPORT');
        console.log('='.repeat(80));

        this.printSummary(report);

        if (report.flakyTests.length === 0) {
            console.log('\n✅ No flaky tests detected! All tests are stable.\n');
            return;
        }

        this.printFlakyTests(report, options);
        this.printRecommendations(report);

        console.log('='.repeat(80));
        console.log(`Report generated at: ${new Date(report.summary.analysisTimestamp).toISOString()}`);
        console.log('='.repeat(80) + '\n');
    }

    private printSummary(report: FlakinessReport): void {
        const { summary } = report;

        console.log('\n📊 SUMMARY');
        console.log('-'.repeat(80));
        console.log(`Total tests analyzed: ${summary.totalTests}`);
        console.log(`Flaky tests found: ${summary.flakyTests}`);

        if (summary.flakyTests > 0) {
            console.log(`  🔴 Critical: ${summary.criticallyFlaky}`);
            console.log(`  🟠 Moderate: ${summary.moderatelyFlaky}`);
            console.log(`  🟡 Mild: ${summary.mildlyFlaky}`);
        }
    }

    private printFlakyTests(report: FlakinessReport, options: ResolvedFlakinessOptions): void {
        console.log('\n🔧 FLAKY TESTS DETAILS');
        console.log('-'.repeat(80));

        report.flakyTests.forEach((metric, index) => {
            const severity = this.getSeverityIcon(metric.flakinessScore, options);

            console.log(`\n${severity} Test #${index + 1}: ${metric.title}`);
            console.log(`   File: ${metric.file}`);
            console.log(`   Flakiness Score: ${metric.flakinessScore.toFixed(2)}/100`);
            console.log(`   Pass Rate: ${metric.passRate.toFixed(1)}% (${metric.passCount}/${metric.totalRuns})`);
            console.log(`   Failures: ${metric.failCount}, Flaky passes: ${metric.flakyCount}`);
            console.log(`   Max retries: ${metric.maxRetries}`);
            console.log(`   Avg duration: ${(metric.avgDuration / 1000).toFixed(2)}s`);

            if (metric.commonErrors.length > 0) {
                console.log(`   Common errors:`);
                metric.commonErrors.slice(0, 2).forEach(err => {
                    console.log(`     • ${err.substring(0, 100)}${err.length > 100 ? '...' : ''}`);
                });
            }
        });
    }

    private printRecommendations(report: FlakinessReport): void {
        if (report.recommendations.length === 0) {
            return;
        }

        console.log('\n💡 RECOMMENDATIONS');
        console.log('-'.repeat(80));

        report.recommendations.forEach(rec => {
            console.log(`• ${rec}`);
        });
    }

    private getSeverityIcon(score: number, options: ResolvedFlakinessOptions): string {
        if (score >= options.criticalThreshold) {
            return '🔴';
        } else if (score >= options.moderateThreshold) {
            return '🟠';
        } else {
            return '🟡';
        }
    }
}
