import { Page, TestInfo } from '@playwright/test';
export declare class TestReporter {
    private page;
    private testInfo;
    constructor(page: Page, testInfo: TestInfo);
    captureScreenshot(name: string): Promise<string>;
    startVideoRecording(): Promise<void>;
    stopVideoRecording(name: string): Promise<null>;
    captureNetworkLogs(): Promise<any[]>;
    saveConsoleLog(name: string): Promise<string>;
    capturePerformanceMetrics(): Promise<{
        loadTime: number;
        domContentLoaded: number;
        firstPaint: number;
        resourceCount: number;
    }>;
}
//# sourceMappingURL=test-reporter.d.ts.map