import { WebDriver } from 'selenium-webdriver';
export type BrowserType = 'chrome' | 'firefox' | 'safari';
export declare class BrowserFactory {
    static createBrowser(type: BrowserType): Promise<WebDriver>;
}
