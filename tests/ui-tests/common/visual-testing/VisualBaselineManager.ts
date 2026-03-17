import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { VisualTestingConfig } from './types';

/**
 * Manages baseline screenshot storage and retrieval.
 *
 * Baselines are PNG files stored under artifacts/visual-testing/baselines/.
 * Actuals (current-run screenshots) are stored alongside for diff inspection.
 *
 * Flow:
 *   Run 1 (no baseline): screenshot saved as baseline → test passes (bootstrapping)
 *   Run 2+            : baseline loaded, both sent to AI for comparison
 */
export class VisualBaselineManager {

    constructor(private config: VisualTestingConfig) {}

    /** Returns true if a baseline file already exists for the given snapshot name. */
    hasBaseline(name: string): boolean {
        return existsSync(this.baselinePath(name));
    }

    /** Loads and returns the raw bytes of the stored baseline. */
    loadBaseline(name: string): Buffer {
        return readFileSync(this.baselinePath(name));
    }

    /** Saves a screenshot as the approved baseline for the given snapshot name. */
    saveBaseline(name: string, screenshot: Buffer): void {
        const path = this.baselinePath(name);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, screenshot);
        console.log(`[visual-testing] Baseline saved → ${path}`);
    }

    /**
     * Saves the current-run screenshot as an "actual" artefact.
     * Returns the absolute path so it can be recorded in the review queue.
     */
    saveActual(name: string, screenshot: Buffer): string {
        const path = this.actualPath(name);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, screenshot);
        return path;
    }

    baselinePath(name: string): string {
        return join(this.config.baselinesDir, `${name}.png`);
    }

    private actualPath(name: string): string {
        return join(this.config.actualsDir, `${name}.png`);
    }
}
