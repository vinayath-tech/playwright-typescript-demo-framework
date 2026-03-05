import type { TestResult } from '@playwright/test/reporter';

export type FailurePattern = {
    testId: string;
    title: string;
    file: string;
    line: number;
    pattern: string;
    occurrences: number;
    errorType: ErrorType;
    suggestedFix?: string;
};

export enum ErrorType {
    SELECTOR_ISSUE = 'selector_issue',
    TIMEOUT = 'timeout',
    ASSERTION_FAILURE = 'assertion_failure',
    NETWORK_ERROR = 'network_error',
    DATA_DEPENDENCY = 'data_dependency',
    RACE_CONDITION = 'race_condition',
    UNKNOWN = 'unknown'
}

export type RedundancyPattern = {
    testGroup: string[];
    file: string;
    reason: string;
    recommendation: string;
};

export type AutoFixSuggestion = {
    testId: string;
    title: string;
    file: string;
    line: number;
    errorType: ErrorType;
    originalCode?: string;
    suggestedFix: string;
    explanation: string;
    confidence: number;
    autoApplicable: boolean;
};

export type AutoFixReport = {
    summary: {
        totalFailures: number;
        fixableFail: number;
        redundantTests: number;
        analysisTimestamp: number;
    };
    fixSuggestions: AutoFixSuggestion[];
    redundancyPatterns: RedundancyPattern[];
};

export type AutoFixAgentOptions = {
    endpoint?: string;
    model?: string;
    apiKey?: string;
    autoApply?: boolean;
    confidenceThreshold?: number;
    analyzeRedundancy?: boolean;
};

export type ResolvedAutoFixOptions = Required<AutoFixAgentOptions>;
