/**
 * Interactive CLI for reviewing AI-detected visual snapshot differences.
 *
 * Usage:
 *   npm run visual:review
 *
 * For each pending diff the reviewer sees the snapshot name, page URL,
 * AI summary, confidence score, and a breakdown of detected change regions,
 * then chooses to approve, reject, or skip.
 *
 *   (a) approve — copies the actual screenshot over the baseline (accepts the change)
 *   (r) reject  — marks as rejected so the next run treats it as a real regression
 *   (s) skip    — leaves pending for later review
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as dotenv from 'dotenv';
import { VisualReviewQueue } from '../tests/ui-tests/common/visual-testing/VisualReviewQueue';

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
    console.log(`${BOLD}  Visual Snapshot Review${RESET}${DIM}                       ${pending} pending${RESET}`);
    console.log(`${BOLD}${line()}${RESET}\n`);
}

async function run() {
    const QUEUE_PATH = resolve(
        process.cwd(),
        'artifacts/visual-testing/pending-review.json'
    );

    const queue = new VisualReviewQueue(QUEUE_PATH);
    const rl    = createInterface({ input, output });

    const pending = queue.getPending();

    if (pending.length === 0) {
        console.log(`\n${GREEN}✓ No pending visual diffs — queue is empty.${RESET}\n`);
        rl.close();
        return;
    }

    header(pending.length);

    let approved = 0;
    let rejected = 0;
    let skipped  = 0;

    for (let i = 0; i < pending.length; i++) {
        const entry      = pending[i];
        const comparison = entry.comparison;
        const pct        = Math.round(comparison.confidence * 100);
        const confidenceColor = pct >= 80 ? GREEN : pct >= 50 ? YELLOW : RED;

        console.log(`${BOLD}[${i + 1}/${pending.length}]${RESET} ${DIM}id: ${entry.id}${RESET}`);
        console.log(`  ${DIM}Timestamp   ${RESET}: ${entry.timestamp}`);
        console.log(`  ${DIM}Snapshot    ${RESET}: ${BOLD}${entry.snapshotName}${RESET}`);
        console.log(`  ${DIM}Page URL    ${RESET}: ${CYAN}${entry.pageUrl}${RESET}`);
        console.log(`  ${DIM}Baseline    ${RESET}: ${entry.baselinePath}`);
        console.log(`  ${DIM}Actual      ${RESET}: ${entry.actualPath}`);
        console.log(`  ${DIM}Match       ${RESET}: ${comparison.isMatch ? GREEN + 'true' : RED + 'false'}${RESET}`);
        console.log(`  ${DIM}Confidence  ${RESET}: ${confidenceColor}${pct}%${RESET}`);
        console.log(`  ${DIM}Summary     ${RESET}: ${comparison.summary}`);
        console.log(`  ${DIM}Recommend.  ${RESET}: ${comparison.recommendation}`);

        if (comparison.diffRegions.length > 0) {
            console.log(`  ${DIM}Changes     ${RESET}:`);
            for (const r of comparison.diffRegions) {
                const col = r.severity === 'major' ? RED : r.severity === 'moderate' ? YELLOW : DIM;
                console.log(`    ${col}• [${r.severity.toUpperCase()}]${RESET} ${r.description}${r.location ? ` ${DIM}(${r.location})${RESET}` : ''}`);
            }
        }
        console.log();

        const answer = await rl.question(
            `  ${BOLD}(a)${RESET}pprove  ${BOLD}(r)${RESET}eject  ${BOLD}(s)${RESET}kip  ? `
        );

        const choice = answer.trim().toLowerCase();

        if (choice === 'a' || choice === 'approve') {
            // Copy actual → baseline so the new state becomes the approved reference
            mkdirSync(dirname(entry.baselinePath), { recursive: true });
            copyFileSync(entry.actualPath, entry.baselinePath);
            queue.updateStatus(entry.id, 'approved');
            console.log(`  ${GREEN}✓ Approved — baseline updated with actual screenshot${RESET}\n`);
            approved++;

        } else if (choice === 'r' || choice === 'reject') {
            queue.updateStatus(entry.id, 'rejected');
            console.log(`  ${RED}✗ Rejected — next run will treat this as a real regression${RESET}\n`);
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
    console.error('review-visuals failed:', err);
    process.exit(1);
});
