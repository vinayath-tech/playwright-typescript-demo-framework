import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';
import type {
    VisualComparisonResult,
    VisualReviewEntry,
    VisualReviewQueueData,
    VisualReviewStatus
} from './types';

/**
 * Manages the pending review queue for visual snapshot differences.
 *
 * In 'review' mode the VisualTestingEngine writes entries here instead of
 * immediately failing the test. The `npm run visual:review` script lets a
 * human approve (update the baseline) or reject (treat as a real regression)
 * each detected diff.
 *
 * Duplicate entries for the same snapshot name are suppressed — a single
 * test run will not spam the queue with repeated failures.
 */
export class VisualReviewQueue {

    constructor(private queuePath: string) {}

    /**
     * Adds a new review entry. Silently returns the existing entry if a
     * pending review for the same snapshot name already exists.
     */
    add(
        entry: Omit<VisualReviewEntry, 'id' | 'timestamp' | 'status' | 'reviewedAt'>
    ): VisualReviewEntry {
        const data = this.load();

        const existing = data.entries.find(
            e => e.snapshotName === entry.snapshotName && e.status === 'pending'
        );
        if (existing) {
            console.log(`[visual-testing] Review entry already queued for "${entry.snapshotName}"`);
            return existing;
        }

        const newEntry: VisualReviewEntry = {
            ...entry,
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        data.entries.push(newEntry);
        this.save(data);
        console.log(`[visual-testing] Queued for human review → "${entry.snapshotName}" (run \`npm run visual:review\` to action)`);
        return newEntry;
    }

    getPending(): VisualReviewEntry[] {
        return this.load().entries.filter(e => e.status === 'pending');
    }

    updateStatus(id: string, status: VisualReviewStatus): void {
        const data = this.load();
        const entry = data.entries.find(e => e.id === id);
        if (entry) {
            entry.status = status;
            entry.reviewedAt = new Date().toISOString();
            this.save(data);
        }
    }

    load(): VisualReviewQueueData {
        if (!existsSync(this.queuePath)) return { entries: [] };
        try {
            return JSON.parse(readFileSync(this.queuePath, 'utf-8')) as VisualReviewQueueData;
        } catch {
            return { entries: [] };
        }
    }

    private save(data: VisualReviewQueueData): void {
        mkdirSync(dirname(this.queuePath), { recursive: true });
        writeFileSync(this.queuePath, JSON.stringify(data, null, 2), 'utf-8');
    }
}
