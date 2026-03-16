import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import type { FileUpdateResult } from './types';

type ReplaceResult = {
    found: boolean;
    updatedContent: string;
    // What string to look for in the file to confirm the write succeeded.
    // For exact string replacements this is the full healed locator.
    // For template literal replacements this is the healed static prefix
    // (e.g. `[data-test="add-to-cart-${) since the resolved string never
    // appears verbatim in the source file.
    confirmString: string;
    line?: number;
};

export class LocatorFileUpdater {

    /**
     * Scans all TypeScript files in pageFactoryDir, replaces every occurrence
     * of `original` as a string literal with `healed`, then reads the file back
     * to confirm the write before returning the canonical healed value.
     */
    async updateLocator(
        original: string,
        healed: string,
        pageFactoryDir: string
    ): Promise<FileUpdateResult> {
        const files = this.getTypeScriptFiles(pageFactoryDir);

        for (const file of files) {
            const content = readFileSync(file, 'utf-8');
            const exact = this.replaceLocator(content, original, healed);
            const result = exact.found ? exact : this.replaceTemplateLiteral(content, original, healed);

            if (!result.found) continue;

            writeFileSync(file, result.updatedContent, 'utf-8');

            // Read back using the correct confirmString for each replacement type:
            //   - exact match   → the full healed locator string
            //   - template      → the healed static prefix (full string never in file)
            const confirmed = readFileSync(file, 'utf-8');
            if (confirmed.includes(result.confirmString)) {
                console.log(`[self-healing] Patched ${file}:${result.line} — "${original}" → "${healed}"`);
                return {
                    success: true,
                    confirmedValue: healed,
                    confirmString: result.confirmString,
                    file,
                    line: result.line
                };
            }

            // Write appeared to succeed but read-back failed — restore original
            console.error(`[self-healing] Read-back verification failed for ${file}, restoring original`);
            writeFileSync(file, content, 'utf-8');
            return { success: false, confirmedValue: healed, confirmString: result.confirmString, file };
        }

        console.warn(`[self-healing] Locator "${original}" not found in any .ts file under: ${pageFactoryDir}`);
        return { success: false, confirmedValue: healed, confirmString: healed };
    }

    private replaceLocator(content: string, original: string, healed: string): ReplaceResult {
        const candidates = [
            { search: `'${original}'`, replace: `'${healed}'` },
            { search: `"${original}"`, replace: `"${healed}"` },
            { search: `\`${original}\``, replace: `\`${healed}\`` },
        ];

        for (const { search, replace } of candidates) {
            if (content.includes(search)) {
                return {
                    found: true,
                    updatedContent: content.replaceAll(search, replace),
                    confirmString: healed,   // full healed string will be in the file
                    line: this.findLineNumber(content, search)
                };
            }
        }

        return { found: false, updatedContent: content, confirmString: healed };
    }

    /**
     * Handles template literal locators (e.g. `[data-test="ad-to-cart-${name}"]`).
     * Finds the common suffix between broken and healed (the dynamic substituted part),
     * isolates the broken static prefix, then replaces it with the healed static prefix
     * inside any matching template literal in the file.
     *
     * Example:
     *   broken : [data-test="ad-to-cart-sauce-labs-bolt-t-shirt"]
     *   healed : [data-test="add-to-cart-sauce-labs-bolt-t-shirt"]
     *   common suffix (dynamic part) : sauce-labs-bolt-t-shirt"]
     *   broken static prefix : [data-test="ad-to-cart-
     *   healed static prefix : [data-test="add-to-cart-
     *   searches for : `[data-test="ad-to-cart-${
     *   replaces with : `[data-test="add-to-cart-${   ← this is the confirmString
     */
    private replaceTemplateLiteral(content: string, broken: string, healed: string): ReplaceResult {
        let commonSuffixLen = 0;
        while (
            commonSuffixLen < broken.length &&
            commonSuffixLen < healed.length &&
            broken[broken.length - 1 - commonSuffixLen] === healed[healed.length - 1 - commonSuffixLen]
        ) {
            commonSuffixLen++;
        }

        if (commonSuffixLen === 0) return { found: false, updatedContent: content, confirmString: healed };

        const brokenPrefix = broken.substring(0, broken.length - commonSuffixLen);
        const healedPrefix = healed.substring(0, healed.length - commonSuffixLen);

        if (brokenPrefix === healedPrefix) return { found: false, updatedContent: content, confirmString: healed };

        const search = `\`${brokenPrefix}\${`;
        const replace = `\`${healedPrefix}\${`;

        if (!content.includes(search)) return { found: false, updatedContent: content, confirmString: healed };

        return {
            found: true,
            updatedContent: content.replaceAll(search, replace),
            confirmString: replace,   // healed prefix in template — this IS what the file will contain
            line: this.findLineNumber(content, search)
        };
    }

    /**
     * Finds which pageFactory file contains `original` and returns its location
     * without making any changes. Used in review mode to populate proposals.
     * Accepts both broken and healed so template literal prefix extraction works
     * the same way as replaceTemplateLiteral.
     */
    locateLocator(original: string, healed: string, pageFactoryDir: string): { file?: string; line?: number } {
        for (const file of this.getTypeScriptFiles(pageFactoryDir)) {
            const content = readFileSync(file, 'utf-8');

            // Try exact string literal matches
            const exactCandidates = [`'${original}'`, `"${original}"`, `\`${original}\``];
            for (const search of exactCandidates) {
                if (content.includes(search)) {
                    return { file, line: this.findLineNumber(content, search) };
                }
            }

            // Try template literal prefix (same algorithm as replaceTemplateLiteral)
            let commonSuffixLen = 0;
            while (
                commonSuffixLen < original.length &&
                commonSuffixLen < healed.length &&
                original[original.length - 1 - commonSuffixLen] === healed[healed.length - 1 - commonSuffixLen]
            ) { commonSuffixLen++; }

            if (commonSuffixLen > 0) {
                const brokenPrefix = original.substring(0, original.length - commonSuffixLen);
                const templateSearch = `\`${brokenPrefix}\${`;
                if (content.includes(templateSearch)) {
                    return { file, line: this.findLineNumber(content, templateSearch) };
                }
            }
        }
        return {};
    }

    private findLineNumber(content: string, search: string): number {
        const idx = content.indexOf(search);
        return idx === -1 ? 0 : content.substring(0, idx).split('\n').length;
    }

    private getTypeScriptFiles(dir: string): string[] {
        return readdirSync(dir)
            .filter(entry => extname(entry) === '.ts' && statSync(join(dir, entry)).isFile())
            .map(entry => join(dir, entry));
    }
}
