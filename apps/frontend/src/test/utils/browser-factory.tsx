import { Builder, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import safari from 'selenium-webdriver/safari';
import { logger } from './logger.js';

export type BrowserType = 'chrome' | 'firefox' | 'safari';

export class BrowserFactory {
  static async createBrowser(type: BrowserType): Promise<WebDriver> {
    logger.info(`Creating ${type} browser instance`);
    
    switch (type) {
      case 'chrome':
        return new Builder()
          .forBrowser('chrome')
          .setChromeOptions(new chrome.Options().headless())
          .build();
      
      case 'firefox':
        return new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(new firefox.Options().headless())
          .build();
      
      case 'safari':
        return new Builder()
          .forBrowser('safari')
          .setSafariOptions(new safari.Options())
          .build();
      
      default:
        throw new Error(`Unsupported browser type: ${type}`);
    }
  }
}