import type { FailureRecord } from "./types";

export class PromptBuilder {

    public buildVisualPrompt(failure: FailureRecord): string {
        return [
            'Analyze this Playwright UI test failure using both the screenshot and the error details below.',
            '',
            `Test       : ${failure.title}`,
            `File       : ${failure.file}:${failure.line}`,
            `Project    : ${failure.project}`,
            `Status     : expected "${failure.expectedStatus}" but got "${failure.actualStatus}"`,
            `Duration   : ${failure.durationMs}ms`,
            `Retry      : ${failure.retry}`,
            `Error      : ${failure.errorMessage ?? 'N/A'}`,
            '',
            'Using the screenshot, provide:',
            '1) What you VISUALLY observe on the screen (error banners, messages, wrong page, popups, CAPTCHA, empty states)',
            '2) Root cause category (e.g. auth failure, selector drift, wrong page loaded, validation error, network error)',
            '3) Most likely root cause combining visual evidence + error message (2-3 sentences)',
            '4) Confidence score (0-100)',
            '5) One concrete next debugging step',
        ].join('\n');
    }

    public buildPrompt(failures: FailureRecord[]): string{
        return [
            'Analyze these Playwright test failures. For each failure, provide:',
            '1) Root cause category (e.g. selector drift, timing/race condition, test data issue, auth/session problem, backend instability, assertion defect)',
            '2) A brief explanation of the most likely root cause (1-2 sentences)',
            '3) A confidence score (0-100)',
            '4) One concrete next debugging step',
            '',
            'Include the failure identifier in your answer using this format:',
            '[file:line] test title',
            '',
            'Failures:',
            JSON.stringify(failures, null, 2)
        ].join('\n');
    }   

}