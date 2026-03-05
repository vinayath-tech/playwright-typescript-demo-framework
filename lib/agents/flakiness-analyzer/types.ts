import type { TestResult } from '@playwright/test/reporter';

export type TestRunRecord = {
    testId: string;
    title: string;
    file: string;
    line: number;
    project: string;
    status: TestResult['status'];
    duration: number;
    retry: number;
    timestamp: number;
    errorMessage?: string;
};

export type FlakinessMetrics = {
    testId: string;
    title: string;
    file: string;
    totalRuns: number;
    passCount: number;
    failCount: number;
    flakyCount: number;
    passRate: number;
    flakinessScore: number;
    avgDuration: number;
    maxRetries: number;
    lastFailure?: string;
    commonErrors: string[];
};

export type FlakinessReport = {
    summary: {
        totalTests: number;
        flakyTests: number;
        criticallyFlaky: number;
        moderatelyFlaky: number;
        mildlyFlaky: number;
        analysisTimestamp: number;
    };
    flakyTests: FlakinessMetrics[];
    recommendations: string[];
};

export type FlakinessAnalyzerOptions = {
    historyFile?: string;
    endpoint?: string;
    model?: string;
    apiKey?: string;
    flakinessThreshold?: number;
    criticalThreshold?: number;
    moderateThreshold?: number;
};

export type ResolvedFlakinessOptions = Required<FlakinessAnalyzerOptions>;
