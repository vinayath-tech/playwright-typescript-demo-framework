import type { Page } from '@playwright/test';
import type { VisualComparisonResult, VisualTestingConfig } from './types';
import { VisualTestingClient } from './VisualTestingClient';
import { VisualBaselineManager } from './VisualBaselineManager';
import { VisualReviewQueue } from './VisualReviewQueue';

export type VisualMatchOptions = {
    /** Capture the full scrollable page instead of only the visible viewport. Defaults to false. */
    fullPage?: boolean;
};

/**
 * Orchestrates the visual snapshot comparison workflow:
 *
 *  1. Capture a screenshot of the current page state.
 *  2. If no baseline exists — save the screenshot as the baseline and pass
 *     (first-run bootstrapping, no AI call needed).
 *  3. Load the stored baseline and send both images to the LLM for comparison.
 *  4. REVIEW mode : queue any mismatch for human approval — test still passes
 *     this run (surface issues without blocking CI).
 *  5. AUTO mode   : throw immediately on mismatch — test fails with the full
 *     AI analysis attached to the error message.
 */
export class VisualTestingEngine {

    private client: VisualTestingClient;
    private baseline: VisualBaselineManager;
    private queue: VisualReviewQueue;

    constructor(private config: VisualTestingConfig) {
        this.client   = new VisualTestingClient(config);
        this.baseline = new VisualBaselineManager(config);
        this.queue    = new VisualReviewQueue(config.reviewQueuePath);
    }

    async compare(page: Page, name: string, options: VisualMatchOptions = {}): Promise<void> {
        if (page.isClosed()) {
            console.warn('[visual-testing] Page is already closed — skipping visual check');
            return;
        }

        console.log(`\n[visual-testing] ── Checking snapshot: "${name}" ──`);

        const screenshot = await page.screenshot({ fullPage: options.fullPage ?? false });
        const pageUrl    = page.url();

        // ── FIRST RUN: save as baseline ────────────────────────────────────────
        if (!this.baseline.hasBaseline(name)) {
            this.baseline.saveBaseline(name, screenshot);
            console.log(`[visual-testing] ✓ No baseline found — screenshot saved as baseline for "${name}"\n`);
            return;
        }

        // ── SUBSEQUENT RUNS: compare against stored baseline ───────────────────
        const baselineBuffer = this.baseline.loadBaseline(name);
        const actualPath     = this.baseline.saveActual(name, screenshot);

        let result: VisualComparisonResult;
        try {
            result = await this.client.compareScreenshots(baselineBuffer, screenshot, name, pageUrl);
        } catch (err) {
            // Surface AI errors as test failures — never silently pass on error
            throw new Error(`[visual-testing] AI comparison failed for "${name}": ${err}`);
        }

        this.logResult(name, result);

        if (result.isMatch || result.recommendation === 'pass') {
            console.log(`[visual-testing] ✓ Visual match confirmed for "${name}" (confidence: ${Math.round(result.confidence * 100)}%)\n`);
            return;
        }

        // ── MISMATCH DETECTED ──────────────────────────────────────────────────
        const baselinePath = this.baseline.baselinePath(name);

        // REVIEW MODE: surface the diff without breaking the test run
        if (this.config.mode === 'review') {
            this.queue.add({
                snapshotName: name,
                baselinePath,
                actualPath,
                pageUrl,
                comparison: result
            });
            console.log(
                `[visual-testing] ⚠ Visual diff queued for review — test passes this run.\n` +
                `  Run \`npm run visual:review\` to approve (update baseline) or reject (flag regression).\n`
            );
            return;
        }

        // AUTO MODE: fail the test immediately with the full AI analysis
        const regionLines = result.diffRegions
            .map(r => `    • [${r.severity.toUpperCase()}] ${r.description}${r.location ? ` (${r.location})` : ''}`)
            .join('\n');

        throw new Error(
            `[visual-testing] Visual regression detected for "${name}"\n` +
            `  Summary   : ${result.summary}\n` +
            `  Confidence: ${Math.round(result.confidence * 100)}%\n` +
            `  Baseline  : ${baselinePath}\n` +
            `  Actual    : ${actualPath}\n` +
            (regionLines ? `  Changes   :\n${regionLines}\n` : '')
        );
    }

    private logResult(name: string, result: VisualComparisonResult): void {
        const pct = Math.round(result.confidence * 100);
        console.log(`[visual-testing] Snapshot    : "${name}"`);
        console.log(`[visual-testing] Match       : ${result.isMatch}`);
        console.log(`[visual-testing] Confidence  : ${pct}%`);
        console.log(`[visual-testing] Summary     : ${result.summary}`);
        if (result.diffRegions.length > 0) {
            console.log('[visual-testing] Diff regions:');
            for (const r of result.diffRegions) {
                console.log(`  • [${r.severity}] ${r.description}${r.location ? ` @ ${r.location}` : ''}`);
            }
        }
    }
}
