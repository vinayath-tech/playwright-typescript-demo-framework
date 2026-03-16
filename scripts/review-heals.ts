/**
 * Interactive CLI for reviewing self-healed locator proposals.
 *
 * Usage:
 *   npm run heal:review
 *
 * For each pending proposal the reviewer sees the broken locator, the AI-proposed
 * replacement, the source file location, confidence score and reasoning, then
 * chooses to approve, reject, or skip.
 *
 *   (a) approve — patches the source file and marks the proposal approved
 *   (r) reject  — marks rejected; locator stays broken so the real bug is visible
 *   (s) skip    — leaves pending for later review
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { HealingQueue } from '../tests/ui-tests/common/self-healing/HealingQueue';
import { LocatorFileUpdater } from '../tests/ui-tests/common/self-healing/LocatorFileUpdater';
import { LocatorCache } from '../tests/ui-tests/common/self-healing/LocatorCache';

dotenv.config({ path: './env/.env.test' });

const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';

function line(char = '─', len = 66) { return char.repeat(len); }

function header(pending: number) {
    console.log(`\n${BOLD}${line()}${RESET}`);
    console.log(`${BOLD}  Self-Healing Locator Review${RESET}${DIM}                  ${pending} pending${RESET}`);
    console.log(`${BOLD}${line()}${RESET}\n`);
}

async function run() {
    // Resolved after dotenv.config() so env vars are available
    const QUEUE_PATH = resolve(
        process.cwd(),
        process.env.SELF_HEALING_QUEUE_PATH ?? 'artifacts/self-healing/pending-review.json'
    );
    const CACHE_PATH = resolve(
        process.cwd(),
        process.env.SELF_HEALING_CACHE_PATH ?? 'artifacts/self-healing/healed-locators.json'
    );
    const PAGE_FACTORY_DIR = resolve(
        process.cwd(),
        process.env.SELF_HEALING_PAGE_FACTORY_DIR ?? 'tests/ui-tests/pageFactory'
    );

    const queue   = new HealingQueue(QUEUE_PATH);
    const updater = new LocatorFileUpdater();
    LocatorCache.configure(CACHE_PATH);

    const rl = createInterface({ input, output });

    const pending = queue.getPending();

    if (pending.length === 0) {
        console.log(`\n${GREEN}✓ No pending proposals — queue is empty.${RESET}\n`);
        rl.close();
        return;
    }

    header(pending.length);

    let approved = 0;
    let rejected = 0;
    let skipped  = 0;

    for (let i = 0; i < pending.length; i++) {
        const proposal = pending[i];
        const pct = Math.round(proposal.confidence * 100);
        const confidenceColor = pct >= 80 ? GREEN : pct >= 50 ? YELLOW : RED;

        console.log(`${BOLD}[${i + 1}/${pending.length}]${RESET} ${DIM}id: ${proposal.id}${RESET}`);
        console.log(`  ${DIM}Timestamp ${RESET}: ${proposal.timestamp}`);
        console.log(`  ${DIM}Page URL  ${RESET}: ${CYAN}${proposal.pageUrl}${RESET}`);

        if (proposal.sourceFile) {
            const rel = proposal.sourceFile.replace(process.cwd() + '/', '');
            console.log(`  ${DIM}Source    ${RESET}: ${rel}${proposal.sourceLine ? `:${proposal.sourceLine}` : ''}`);
        }

        console.log(`  ${DIM}Broken    ${RESET}: ${RED}${proposal.brokenLocator}${RESET}`);
        console.log(`  ${DIM}Healed    ${RESET}: ${GREEN}${proposal.healedLocator}${RESET}`);
        console.log(`  ${DIM}Confidence${RESET}: ${confidenceColor}${pct}%${RESET}`);
        console.log(`  ${DIM}Reasoning ${RESET}: ${proposal.reasoning}`);
        console.log();

        const answer = await rl.question(
            `  ${BOLD}(a)${RESET}pprove  ${BOLD}(r)${RESET}eject  ${BOLD}(s)${RESET}kip  ? `
        );

        const choice = answer.trim().toLowerCase();

        if (choice === 'a' || choice === 'approve') {
            const result = await updater.updateLocator(
                proposal.brokenLocator,
                proposal.healedLocator,
                PAGE_FACTORY_DIR
            );

            if (result.success) {
                queue.updateStatus(proposal.id, 'approved');
                LocatorCache.set(proposal.brokenLocator, proposal.healedLocator);
                console.log(`  ${GREEN}✓ Approved — source file patched${RESET}\n`);
                approved++;
            } else {
                console.log(`  ${YELLOW}⚠ Approved but source file could not be patched automatically.`);
                console.log(`    Manual fix needed in: ${proposal.sourceFile ?? PAGE_FACTORY_DIR}${RESET}`);
                queue.updateStatus(proposal.id, 'approved');
                approved++;
            }

        } else if (choice === 'r' || choice === 'reject') {
            queue.updateStatus(proposal.id, 'rejected');
            LocatorCache.clear();   // force re-evaluation on next run
            console.log(`  ${RED}✗ Rejected — locator will fail on next run so the real bug is visible${RESET}\n`);
            rejected++;

        } else {
            console.log(`  ${DIM}→ Skipped${RESET}\n`);
            skipped++;
        }

        if (i < pending.length - 1) console.log(DIM + line('·') + RESET + '\n');
    }

    console.log(`\n${line()}`);
    console.log(
        `  Summary: ` +
        `${GREEN}${approved} approved${RESET}  ` +
        `${RED}${rejected} rejected${RESET}  ` +
        `${DIM}${skipped} skipped${RESET}`
    );
    console.log(`${line()}\n`);

    rl.close();
}

run().catch(err => {
    console.error('review-heals failed:', err);
    process.exit(1);
});
