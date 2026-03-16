export type LocatorType = 'css' | 'xpath' | 'text' | 'role' | 'testId';

export type HealedLocator = {
    type: LocatorType;
    value: string;
    confidence: number;
    reasoning: string;
};

export type SelfHealingConfig = {
    enabled: boolean;
    /** auto: patch source files immediately. review: queue for human approval first. */
    mode: 'auto' | 'review';
    endpoint: string;
    apiKey: string;
    model: string;
    pageFactoryDir: string;
    cachePath: string;
    queuePath: string;
};

export type FileUpdateResult = {
    success: boolean;
    confirmedValue: string;
    confirmString: string;   // what to look for in the file to verify the write
    file?: string;
    line?: number;
};

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export type HealingProposal = {
    id: string;
    timestamp: string;
    brokenLocator: string;
    healedLocator: string;
    confidence: number;
    reasoning: string;
    sourceFile?: string;
    sourceLine?: number;
    pageUrl: string;
    status: ProposalStatus;
    reviewedAt?: string;
};

export type HealingQueueData = {
    proposals: HealingProposal[];
};
