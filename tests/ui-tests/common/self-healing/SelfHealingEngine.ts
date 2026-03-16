import type { Page } from '@playwright/test';
import type { HealedLocator, SelfHealingConfig } from './types';
import { SelfHealingClient } from './SelfHealingClient';
import { LocatorFileUpdater } from './LocatorFileUpdater';
import { LocatorCache } from './LocatorCache';
import { HealingQueue } from './HealingQueue';

export class SelfHealingEngine {

    private client: SelfHealingClient;
    private updater: LocatorFileUpdater;
    private queue: HealingQueue;

    constructor(private config: SelfHealingConfig) {
        this.client = new SelfHealingClient(config);
        this.updater = new LocatorFileUpdater();
        this.queue = new HealingQueue(config.queuePath);
        LocatorCache.configure(config.cachePath);
    }

    /**
     * Full self-healing flow for a broken locator:
     *  1. Return cached healed locator if already resolved this run
     *  2. Call AI for alternative locators
     *  3. Validate each alternative against the live DOM
     *  4. Patch the source file in pageFactory/ (BLOCKING — must succeed before retry)
     *  5. Read-back confirms the write; canonical value stored in cache
     *  6. Return healed locator → WebActions retries the action in the same run
     */
    async healLocator(page: Page, originalLocator: string): Promise<string | null> {
        if (LocatorCache.has(originalLocator)) {
            const cached = LocatorCache.get(originalLocator)!;
            console.log(`[self-healing] Cache hit: "${originalLocator}" → "${cached}"`);
            return cached;
        }

        if (page.isClosed()) {
            console.warn('[self-healing] Page is already closed — skipping heal');
            return null;
        }

        console.log(`\n[self-healing] ── Healing broken locator: "${originalLocator}" ──`);

        const pageSource = await page.content();
        const pageUrl = page.url();
        const locatorType = this.detectLocatorType(originalLocator);

        let alternatives: HealedLocator[];
        try {
            alternatives = await this.client.getAlternativeLocators(
                pageSource, originalLocator, locatorType, pageUrl
            );
        } catch (err) {
            console.error('[self-healing] AI call failed:', err);
            return null;
        }

        if (alternatives.length === 0) {
            console.warn('[self-healing] AI returned no alternatives — cannot heal');
            return null;
        }

        console.log(`[self-healing] AI returned ${alternatives.length} alternative(s), validating against live DOM...`);

        const working = await this.findWorkingLocator(page, alternatives);
        if (!working) {
            console.warn('[self-healing] No AI alternative matched a live element');
            return null;
        }

        console.log(`[self-healing] Working alternative found: "${working.value}" (confidence: ${working.confidence})`);
        console.log(`[self-healing] Reasoning: ${working.reasoning}`);

        // ── REVIEW MODE ────────────────────────────────────────────────────────
        // Queue the proposal for human approval instead of auto-patching.
        // The test still passes this run via in-memory heal; source files are only
        // touched after a human runs `npm run heal:review` and approves.
        if (this.config.mode === 'review') {
            const location = this.updater.locateLocator(originalLocator, working.value, this.config.pageFactoryDir);
            this.queue.add({
                brokenLocator: originalLocator,
                healedLocator: working.value,
                confidence: working.confidence,
                reasoning: working.reasoning,
                sourceFile: location.file,
                sourceLine: location.line,
                pageUrl
            });
            LocatorCache.set(originalLocator, working.value);
            console.log(`[self-healing] ✓ In-memory heal applied — awaiting human review via \`npm run heal:review\`\n`);
            return working.value;
        }

        // ── AUTO MODE ──────────────────────────────────────────────────────────
        // Patch the source file FIRST — retry only happens after confirmed write
        const updateResult = await this.updater.updateLocator(
            originalLocator,
            working.value,
            this.config.pageFactoryDir
        );

        if (!updateResult.success) {
            console.warn('[self-healing] Source file was not patched — healed locator is in-memory only for this run');
        }

        const healedLocator = updateResult.confirmedValue;
        LocatorCache.set(originalLocator, healedLocator);
        console.log(`[self-healing] ✓ Healed: "${originalLocator}" → "${healedLocator}"\n`);

        return healedLocator;
    }

    private async findWorkingLocator(page: Page, alternatives: HealedLocator[]): Promise<HealedLocator | null> {
        for (const alt of alternatives) {
            try {
                const locator = this.buildLocator(page, alt);
                const count = await locator.count();
                if (count > 0) return alt;
            } catch {
                // Invalid locator syntax from AI — skip and try next
            }
        }
        return null;
    }

    private buildLocator(page: Page, alt: HealedLocator) {
        switch (alt.type) {
            case 'xpath':   return page.locator(`xpath=${alt.value}`);
            case 'text':    return page.locator(`text=${alt.value}`);
            case 'testId':  return page.getByTestId(alt.value);
            case 'role':
            case 'css':
            default:        return page.locator(alt.value);
        }
    }

    private detectLocatorType(selector: string): string {
        if (selector.startsWith('//') || selector.startsWith('xpath=')) return 'xpath';
        if (selector.startsWith('text='))  return 'text';
        if (selector.startsWith('role='))  return 'role';
        return 'css';
    }
}
