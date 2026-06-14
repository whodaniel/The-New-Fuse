import { Page } from '@playwright/test';
export declare class BasePage {
    protected page: Page;
    constructor(page: Page);
    navigate(path: string): Promise<void>;
    waitForLoad(): Promise<void>;
    protected waitAndClick(selector: string): Promise<void>;
    protected waitAndFill(selector: string, value: string): Promise<void>;
    takeScreenshot(name: string): Promise<void>;
    getCurrentUrl(): Promise<string>;
}
//# sourceMappingURL=base.page.d.ts.map