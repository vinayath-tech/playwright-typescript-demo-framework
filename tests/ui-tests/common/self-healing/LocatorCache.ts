import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Singleton cache that maps broken locators to their healed replacements.
 *
 * Persists to a JSON file so healed locators survive across test runs —
 * preventing redundant AI calls for locators that were already healed before.
 *
 * Flow:
 *   Run 1: cache miss → AI heals → saved to JSON → test passes
 *   Run 2: JSON loaded at startup → cache hit → no AI call → test passes
 */
export class LocatorCache {

    private static cache = new Map<string, string>();
    private static persistPath: string | null = null;
    private static loaded = false;

    static configure(persistPath: string): void {
        this.persistPath = persistPath;
        this.loaded = false; // allow re-load if path changes between workers
    }

    static get(original: string): string | undefined {
        this.ensureLoaded();
        return this.cache.get(original);
    }

    static set(original: string, healed: string): void {
        this.ensureLoaded();
        this.cache.set(original, healed);
        this.persist();
    }

    static has(original: string): boolean {
        this.ensureLoaded();
        return this.cache.has(original);
    }

    static getSummary(): Record<string, string> {
        return Object.fromEntries(this.cache);
    }

    static clear(): void {
        this.cache.clear();
    }

    private static ensureLoaded(): void {
        if (this.loaded || !this.persistPath) return;
        this.loaded = true;

        if (!existsSync(this.persistPath)) return;

        try {
            const raw = readFileSync(this.persistPath, 'utf-8');
            const data = JSON.parse(raw) as Record<string, string>;
            for (const [broken, healed] of Object.entries(data)) {
                this.cache.set(broken, healed);
            }
            console.log(`[self-healing] Loaded ${this.cache.size} cached locator(s) from ${this.persistPath}`);
        } catch {
            console.warn(`[self-healing] Could not load cache from ${this.persistPath} — starting fresh`);
        }
    }

    private static persist(): void {
        if (!this.persistPath) return;
        try {
            mkdirSync(dirname(this.persistPath), { recursive: true });
            const data = Object.fromEntries(this.cache);
            writeFileSync(this.persistPath, JSON.stringify(data, null, 2), 'utf-8');
        } catch {
            console.warn(`[self-healing] Could not write cache to ${this.persistPath}`);
        }
    }
}
