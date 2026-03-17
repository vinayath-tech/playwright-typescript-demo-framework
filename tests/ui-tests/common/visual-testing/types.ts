export type VisualDiffSeverity = 'minor' | 'moderate' | 'major';

export type VisualDiffRegion = {
    /** Human-readable description of what changed. */
    description: string;
    /** How impactful the change is to the user experience. */
    severity: VisualDiffSeverity;
    /** Approximate screen location, e.g. "top-left", "navigation bar". */
    location?: string;
};

export type VisualComparisonResult = {
    /** true if the screenshots are visually equivalent for regression purposes. */
    isMatch: boolean;
    /** Confidence in the assessment (0.0 – 1.0). */
    confidence: number;
    /** Regions where changes were detected. Empty when isMatch is true. */
    diffRegions: VisualDiffRegion[];
    /** One-sentence summary of the comparison outcome. */
    summary: string;
    /** AI recommendation on whether this should pass, fail, or be reviewed. */
    recommendation: 'pass' | 'fail' | 'review';
};

export type VisualTestingConfig = {
    enabled: boolean;
    /** auto: fail immediately on mismatch. review: queue for human approval first. */
    mode: 'auto' | 'review';
    endpoint: string;
    apiKey: string;
    model: string;
    baselinesDir: string;
    actualsDir: string;
    diffsDir: string;
    reviewQueuePath: string;
};

export type VisualReviewStatus = 'pending' | 'approved' | 'rejected';

export type VisualReviewEntry = {
    id: string;
    timestamp: string;
    snapshotName: string;
    baselinePath: string;
    actualPath: string;
    pageUrl: string;
    status: VisualReviewStatus;
    reviewedAt?: string;
    comparison: VisualComparisonResult;
};

export type VisualReviewQueueData = {
    entries: VisualReviewEntry[];
};
