import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';
import type { HealingProposal, HealingQueueData, ProposalStatus } from './types';

/**
 * Manages the pending review queue for healed locators.
 *
 * In 'review' mode the SelfHealingEngine writes proposals here instead of
 * auto-patching source files. The `npm run heal:review` script then lets a
 * human approve or reject each proposal before any source file is touched.
 */
export class HealingQueue {

    constructor(private queuePath: string) {}

    /**
     * Adds a new proposal. Skips silently if an identical broken locator is
     * already pending so duplicate test failures don't spam the queue.
     */
    add(proposal: Omit<HealingProposal, 'id' | 'timestamp' | 'status'>): HealingProposal {
        const data = this.load();

        const existing = data.proposals.find(
            p => p.brokenLocator === proposal.brokenLocator && p.status === 'pending'
        );
        if (existing) {
            console.log(`[self-healing] Proposal already queued for "${proposal.brokenLocator}"`);
            return existing;
        }

        const newProposal: HealingProposal = {
            ...proposal,
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        data.proposals.push(newProposal);
        this.save(data);
        console.log(`[self-healing] Queued for human review → "${proposal.healedLocator}" (run \`npm run heal:review\` to action)`);
        return newProposal;
    }

    getPending(): HealingProposal[] {
        return this.load().proposals.filter(p => p.status === 'pending');
    }

    updateStatus(id: string, status: ProposalStatus): void {
        const data = this.load();
        const proposal = data.proposals.find(p => p.id === id);
        if (proposal) {
            proposal.status = status;
            proposal.reviewedAt = new Date().toISOString();
            this.save(data);
        }
    }

    load(): HealingQueueData {
        if (!existsSync(this.queuePath)) return { proposals: [] };
        try {
            return JSON.parse(readFileSync(this.queuePath, 'utf-8')) as HealingQueueData;
        } catch {
            return { proposals: [] };
        }
    }

    private save(data: HealingQueueData): void {
        mkdirSync(dirname(this.queuePath), { recursive: true });
        writeFileSync(this.queuePath, JSON.stringify(data, null, 2), 'utf-8');
    }
}
