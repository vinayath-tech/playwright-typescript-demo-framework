import type { TestCase, TestResult } from '@playwright/test/reporter';

export type FailureRecord = {
    title: string,
    file: string,
    line: number,
    column: number,
    project: string,
    expectedStatus: TestResult['status'] | TestCase['expectedStatus'],
    actualStatus: TestResult['status'],
    durationMs: number,
    retry: number,
    errorMessage?: string,
    stack?: string,
    screenshotBase64?: string,
    screenshotMimeType?: string
}

export type AiTriageReporterOptions = {
    endpoint?: string,
    model?: string,
    apiKey?: string,
    maxFailures?: number
}

export type ResolvedOptions = Required<AiTriageReporterOptions>;