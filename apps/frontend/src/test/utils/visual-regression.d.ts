import { WebDriver } from 'selenium-webdriver';
export declare class VisualRegression {
    private static readonly SCREENSHOTS_DIR;
    private static readonly DIFFS_DIR;
    static initialize(): Promise<void>;
    static compareScreenshot(driver: WebDriver, name: string, threshold?: number): Promise<boolean>;
}
