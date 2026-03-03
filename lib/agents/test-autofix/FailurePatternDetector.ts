import * as fs from 'fs';
import type { ErrorType } from './types';

export class FailurePatternDetector {

    detectErrorType(errorMessage: string, stack?: string): ErrorType {
        const message = errorMessage.toLowerCase();
        const fullContext = `${message} ${stack || ''}`.toLowerCase();

        if (this.isSelectorIssue(fullContext)) {
            return 'selector_issue' as ErrorType;
        } else if (this.isTimeoutIssue(fullContext)) {
            return 'timeout' as ErrorType;
        } else if (this.isNetworkError(fullContext)) {
            return 'network_error' as ErrorType;
        } else if (this.isAssertionFailure(fullContext)) {
            return 'assertion_failure' as ErrorType;
        } else if (this.isDataDependency(fullContext)) {
            return 'data_dependency' as ErrorType;
        } else if (this.isRaceCondition(fullContext)) {
            return 'race_condition' as ErrorType;
        }

        return 'unknown' as ErrorType;
    }

    extractRelevantCode(filePath: string, line: number, context: number = 5): string {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');

            const startLine = Math.max(0, line - context - 1);
            const endLine = Math.min(lines.length, line + context);

            const codeLines = lines.slice(startLine, endLine);
            return codeLines.map((l, i) => {
                const lineNum = startLine + i + 1;
                const marker = lineNum === line ? '>>> ' : '    ';
                return `${marker}${lineNum}: ${l}`;
            }).join('\n');
        } catch (error) {
            return `Unable to read file: ${filePath}`;
        }
    }

    private isSelectorIssue(context: string): boolean {
        const selectorPatterns = [
            'selector',
            'locator',
            'element not found',
            'no element',
            'strict mode violation',
            'multiple elements',
            'waiting for selector'
        ];
        return selectorPatterns.some(pattern => context.includes(pattern));
    }

    private isTimeoutIssue(context: string): boolean {
        const timeoutPatterns = [
            'timeout',
            'timed out',
            'exceeded',
            'waiting for'
        ];
        return timeoutPatterns.some(pattern => context.includes(pattern));
    }

    private isNetworkError(context: string): boolean {
        const networkPatterns = [
            'network',
            'net::err',
            'fetch failed',
            'request failed',
            'connection refused',
            'econnrefused'
        ];
        return networkPatterns.some(pattern => context.includes(pattern));
    }

    private isAssertionFailure(context: string): boolean {
        const assertionPatterns = [
            'expect(',
            'assertion',
            'expected',
            'but was',
            'to be',
            'to equal'
        ];
        return assertionPatterns.some(pattern => context.includes(pattern));
    }

    private isDataDependency(context: string): boolean {
        const dataPatterns = [
            'not found',
            'does not exist',
            'no data',
            'empty result',
            'null or undefined'
        ];
        return dataPatterns.some(pattern => context.includes(pattern));
    }

    private isRaceCondition(context: string): boolean {
        const racePatterns = [
            'detached',
            'stale element',
            'navigation',
            'frame was detached'
        ];
        return racePatterns.some(pattern => context.includes(pattern));
    }
}
