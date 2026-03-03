import * as fs from 'fs';
import * as path from 'path';

export class RedundancyDetector {

    detectRedundantTests(testFiles: string[]): Array<{ tests: string[], reason: string }> {
        const redundancies: Array<{ tests: string[], reason: string }> = [];

        // Group tests by similarity
        const testGroups = this.groupSimilarTests(testFiles);

        testGroups.forEach(group => {
            if (group.tests.length > 1) {
                redundancies.push({
                    tests: group.tests,
                    reason: group.reason
                });
            }
        });

        return redundancies;
    }

    private groupSimilarTests(testFiles: string[]): Array<{ tests: string[], reason: string }> {
        const groups: Array<{ tests: string[], reason: string }> = [];

        // Look for tests with identical or very similar names
        const nameGroups = new Map<string, string[]>();

        testFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const testMatches = content.matchAll(/test\(['"](.*?)['"]/g);

                for (const match of testMatches) {
                    const testName = this.normalizeTestName(match[1]);
                    if (!nameGroups.has(testName)) {
                        nameGroups.set(testName, []);
                    }
                    nameGroups.get(testName)!.push(`${file}:${match[1]}`);
                }
            } catch (error) {
                // Skip files that can't be read
            }
        });

        nameGroups.forEach((tests, normalizedName) => {
            if (tests.length > 1) {
                groups.push({
                    tests,
                    reason: `Similar test names detected (normalized: "${normalizedName}")`
                });
            }
        });

        return groups;
    }

    private normalizeTestName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    analyzeTestCoverage(testFile: string): { assertions: number, coverage: string[] } {
        try {
            const content = fs.readFileSync(testFile, 'utf-8');

            // Count assertions
            const assertionPatterns = [
                /expect\(/g,
                /assert\./g,
                /toBe\(/g,
                /toHave/g,
                /toEqual\(/g
            ];

            let assertions = 0;
            assertionPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    assertions += matches.length;
                }
            });

            // Identify what's being tested (rough heuristic)
            const coverage: string[] = [];

            if (content.includes('login')) coverage.push('authentication');
            if (content.includes('cart') || content.includes('checkout')) coverage.push('e-commerce');
            if (content.includes('api') || content.includes('request')) coverage.push('api');
            if (content.includes('click') || content.includes('fill')) coverage.push('ui-interaction');
            if (content.includes('accessibility') || content.includes('axe')) coverage.push('accessibility');

            return { assertions, coverage };

        } catch (error) {
            return { assertions: 0, coverage: [] };
        }
    }
}
