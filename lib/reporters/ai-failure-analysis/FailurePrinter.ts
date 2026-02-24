import * as path from 'path';
import type { FailureRecord } from './types';

export class FailurePrinter {

    printVisualAnalysis(failure: FailureRecord, aiMessage: string | undefined): void {
        const label = `[${path.basename(failure.file)}:${failure.line}] ${failure.title}`;
        console.log(`\n=== 📸 AI Visual Analysis: ${label} ===`);
        console.log(aiMessage || 'No analysis returned from AI');
        console.log('='.repeat(60));
    }

    printTextAnalysis(aiMessage: string | undefined): void {
        console.log('\n=== 📝 AI Text Failure Analysis ===');
        console.log(aiMessage || 'No analysis returned from AI');
        console.log('='.repeat(60));
    }

    printLocalSummary(failures: FailureRecord[]): void {
        console.log('\n[ai-triage] Local failure summary:');
        for (const failure of failures) {
            console.log(`- [${failure.file}:${failure.line}] ${failure.title}`);
            console.log(`  actual vs expected: ${failure.actualStatus} vs ${failure.expectedStatus}`);
            if (failure.errorMessage) {
                console.log(`  error: ${failure.errorMessage.split('\n')[0]}`);
            }
        }
        console.log('');
    }

    printVisualAnalysisError(failure: FailureRecord, error: unknown): void {
        const label = `[${path.basename(failure.file)}:${failure.line}] ${failure.title}`;
        console.error(`[ai-failure-analysis] Error during visual analysis for "${label}":`, error);
    }
}