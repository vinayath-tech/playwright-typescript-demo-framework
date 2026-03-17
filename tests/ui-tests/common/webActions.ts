import { Page, expect } from '@playwright/test';
import { Locator } from 'playwright';
import { resolve } from 'path';
import { SelfHealingEngine } from './self-healing/SelfHealingEngine';
import type { SelfHealingConfig } from './self-healing/types';
import { VisualTestingEngine, type VisualMatchOptions } from './visual-testing/VisualTestingEngine';

// How long the INITIAL action attempt waits before giving up and triggering healing.
// Kept short so healing has time to run within the overall test timeout.
const INITIAL_ACTION_TIMEOUT_MS = 5000;

function buildVisualTestingConfig() {
    return {
        enabled: process.env.VISUAL_TESTING_ENABLED === 'true',
        mode: (process.env.VISUAL_TESTING_MODE ?? 'review') as 'auto' | 'review',
        endpoint: process.env.VISUAL_TESTING_AI_ENDPOINT ?? 'https://api.openai.com/v1/responses',
        apiKey: process.env.VISUAL_TESTING_AI_KEY ?? '',
        model: process.env.VISUAL_TESTING_AI_MODEL ?? 'gpt-4o',
        baselinesDir: resolve(
            process.cwd(),
            process.env.VISUAL_TESTING_BASELINES_DIR ?? 'artifacts/visual-testing/baselines'
        ),
        actualsDir: resolve(process.cwd(), 'artifacts/visual-testing/actuals'),
        diffsDir: resolve(process.cwd(), 'artifacts/visual-testing/diffs'),
        reviewQueuePath: resolve(process.cwd(), 'artifacts/visual-testing/pending-review.json'),
    };
}

function buildSelfHealingConfig(): SelfHealingConfig {
    return {
        enabled: process.env.SELF_HEALING_ENABLED === 'true',
        mode: (process.env.SELF_HEALING_MODE ?? 'review') as 'auto' | 'review',
        endpoint: process.env.SELF_HEALING_AI_ENDPOINT ?? 'https://api.openai.com/v1/responses',
        apiKey: process.env.SELF_HEALING_AI_KEY ?? '',
        model: process.env.SELF_HEALING_AI_MODEL ?? 'gpt-4o',
        pageFactoryDir: resolve(
            process.cwd(),
            process.env.SELF_HEALING_PAGE_FACTORY_DIR ?? 'tests/ui-tests/pageFactory'
        ),
        cachePath: resolve(
            process.cwd(),
            process.env.SELF_HEALING_CACHE_PATH ?? 'artifacts/self-healing/healed-locators.json'
        ),
        queuePath: resolve(
            process.cwd(),
            process.env.SELF_HEALING_QUEUE_PATH ?? 'artifacts/self-healing/pending-review.json'
        )
    };
}

export class WebActions {

    readonly page: Page;
    private engine: SelfHealingEngine | null;
    private visualEngine: VisualTestingEngine | null;

    constructor(page: Page) {
        this.page = page;
        const selfHealingConfig = buildSelfHealingConfig();
        this.engine = selfHealingConfig.enabled ? new SelfHealingEngine(selfHealingConfig) : null;
        const visualConfig = buildVisualTestingConfig();
        this.visualEngine = visualConfig.enabled ? new VisualTestingEngine(visualConfig) : null;
    }

    /**
     * Wraps any locator-based action with self-healing.
     *
     * - Primary attempt uses a short timeout so it fails fast before the test
     *   timeout is reached, giving the healing pipeline time to run.
     * - On failure, checks the page is still open, then asks AI for alternatives,
     *   patches the source file, and retries with the healed locator — all in the
     *   same test run.
     * - The retry uses the Playwright default timeout (full wait) since the healed
     *   locator is expected to match.
     */
    private async withSelfHealing<T>(
        selector: string,
        action: (sel: string, timeout?: number) => Promise<T>
    ): Promise<T> {
        try {
            return await action(selector, INITIAL_ACTION_TIMEOUT_MS);
        } catch (primaryErr) {
            if (!this.engine || this.page.isClosed()) throw primaryErr;

            const healed = await this.engine.healLocator(this.page, selector);
            if (!healed) throw primaryErr;

            return await action(healed, undefined);
        }
    }

    async navigateTo(url: string): Promise<void> {
        await this.page.goto(url);
    }

    async enterText(selector: string, text: string): Promise<void> {
        await this.withSelfHealing(selector,
            (sel, timeout) => this.page.locator(sel).fill(text, { timeout })
        );
    }

    async clickElement(selector: string): Promise<void> {
        await this.withSelfHealing(selector,
            (sel, timeout) => this.page.locator(sel).click({ timeout })
        );
    }

    async isElementVisible(selector: string): Promise<boolean> {
        const visible = await this.page.locator(selector).first().isVisible();
        if (!visible && this.engine && !this.page.isClosed()) {
            const healed = await this.engine.healLocator(this.page, selector);
            if (healed) {
                return this.page.locator(healed).first().isVisible();
            }
        }
        return visible;
    }

    async isTextPresent(selector: string, expectedText: string) {
        await this.withSelfHealing(selector, async (sel, timeout) => {
            const locator = this.page.locator(sel);
            await expect(locator).toHaveText(expectedText, { timeout });
        });
    }

    async getAllElements(selector: string): Promise<Locator[]> {
        return await this.withSelfHealing(selector,
            (sel) => this.page.locator(sel).all()
        );
    }

    async selectDropdownByValue(selector: string, value: string): Promise<void> {
        await this.withSelfHealing(selector,
            (sel, timeout) => this.page.selectOption(sel, value, { timeout })
        );
    }

    /**
     * Captures a screenshot and validates it against the stored baseline using
     * an LLM vision model.
     *
     * - First call for a given `name`: saves the screenshot as the baseline
     *   and passes immediately (bootstrapping run — no AI call needed).
     * - Subsequent calls: sends baseline + actual to the LLM for pixel-level
     *   comparison and acts according to the configured mode:
     *     • review — queues any detected diff for human review, test passes.
     *     • auto   — throws with the full AI analysis on mismatch, test fails.
     *
     * No-op when VISUAL_TESTING_ENABLED is not set to 'true'.
     */
    async assertVisualMatch(name: string, options?: VisualMatchOptions): Promise<void> {
        if (!this.visualEngine) return;
        await this.visualEngine.compare(this.page, name, options);
    }
}
