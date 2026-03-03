import * as fs from 'fs';
import * as path from 'path';
import type { TestRunRecord, FlakinessMetrics } from './types';

export class HistoryTracker {
    private historyFile: string;
    private history: TestRunRecord[] = [];

    constructor(historyFile: string = 'test-history.json') {
        this.historyFile = path.resolve(historyFile);
        this.loadHistory();
    }

    private loadHistory(): void {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = fs.readFileSync(this.historyFile, 'utf-8');
                this.history = JSON.parse(data);
            }
        } catch (error) {
            console.warn(`[flakiness-analyzer] Failed to load history: ${error}`);
            this.history = [];
        }
    }

    addTestRun(record: TestRunRecord): void {
        this.history.push(record);
    }

    saveHistory(): void {
        try {
            const dir = path.dirname(this.historyFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.error(`[flakiness-analyzer] Failed to save history: ${error}`);
        }
    }

    getTestHistory(testId: string, limit: number = 100): TestRunRecord[] {
        return this.history
            .filter(record => record.testId === testId)
            .slice(-limit);
    }

    getAllHistory(): TestRunRecord[] {
        return this.history;
    }

    calculateFlakinessMetrics(testId: string): FlakinessMetrics | null {
        const runs = this.getTestHistory(testId);

        if (runs.length === 0) {
            return null;
        }

        const firstRun = runs[0];
        const passCount = runs.filter(r => r.status === 'passed').length;
        const failCount = runs.filter(r => r.status === 'failed' || r.status === 'timedOut').length;
        const flakyCount = runs.filter(r => r.retry > 0 && r.status === 'passed').length;

        const passRate = runs.length > 0 ? (passCount / runs.length) * 100 : 0;

        // Flakiness score: higher = more flaky
        // Factors: failure rate, retry frequency, inconsistency pattern
        let flakinessScore = 0;

        // Add points for failures
        flakinessScore += (failCount / runs.length) * 40;

        // Add points for retries that eventually passed
        flakinessScore += (flakyCount / runs.length) * 30;

        // Add points for inconsistent patterns (alternating pass/fail)
        let alternations = 0;
        for (let i = 1; i < runs.length; i++) {
            const prevPassed = runs[i - 1].status === 'passed';
            const currPassed = runs[i].status === 'passed';
            if (prevPassed !== currPassed) {
                alternations++;
            }
        }
        flakinessScore += (alternations / runs.length) * 30;

        const avgDuration = runs.reduce((sum, r) => sum + r.duration, 0) / runs.length;
        const maxRetries = Math.max(...runs.map(r => r.retry));

        const failedRuns = runs.filter(r => r.errorMessage);
        const lastFailure = failedRuns.length > 0 ? failedRuns[failedRuns.length - 1].errorMessage : undefined;

        // Extract common error patterns
        const errorCounts = new Map<string, number>();
        failedRuns.forEach(run => {
            if (run.errorMessage) {
                // Normalize error message (remove line numbers, paths)
                const normalized = run.errorMessage
                    .replace(/:\d+:\d+/g, '')
                    .replace(/line \d+/gi, 'line X')
                    .substring(0, 200);
                errorCounts.set(normalized, (errorCounts.get(normalized) || 0) + 1);
            }
        });

        const commonErrors = Array.from(errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([msg]) => msg);

        return {
            testId,
            title: firstRun.title,
            file: firstRun.file,
            totalRuns: runs.length,
            passCount,
            failCount,
            flakyCount,
            passRate,
            flakinessScore,
            avgDuration,
            maxRetries,
            lastFailure,
            commonErrors
        };
    }

    getAllFlakinessMetrics(): FlakinessMetrics[] {
        const testIds = new Set(this.history.map(r => r.testId));
        const metrics: FlakinessMetrics[] = [];

        testIds.forEach(testId => {
            const metric = this.calculateFlakinessMetrics(testId);
            if (metric) {
                metrics.push(metric);
            }
        });

        return metrics.sort((a, b) => b.flakinessScore - a.flakinessScore);
    }

    pruneOldHistory(daysToKeep: number = 30): void {
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        this.history = this.history.filter(record => record.timestamp > cutoffTime);
    }
}
