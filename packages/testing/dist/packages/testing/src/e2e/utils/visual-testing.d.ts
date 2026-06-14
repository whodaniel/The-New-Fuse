import { Page } from '@playwright/test';
export declare class VisualTesting {
    private page;
    private testInfo;
    private snapshotsDir;
    constructor(page: Page, testInfo: any, snapshotsDir?: string);
    private getSnapshotPath;
    compareScreenshot(name: string, locator?: string, threshold?: number): Promise<void>;
    updateBaseline(name: string, locator?: string): Promise<void>;
    compareElement(selector: string, name: string): Promise<void>;
    compareFullPage(name: string): Promise<void>;
    compareResponsive(name: string, viewports?: {
        width: number;
        height: number;
    }[]): Promise<void>;
    captureInteractionStates(selector: string, name: string, states?: string[]): Promise<void>;
}
//# sourceMappingURL=visual-testing.d.ts.map