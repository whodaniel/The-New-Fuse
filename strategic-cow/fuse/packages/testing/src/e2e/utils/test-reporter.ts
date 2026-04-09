import { Page, TestInfo } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export class TestReporter {
  constructor(private page: Page, private testInfo: TestInfo) {}

  async captureScreenshot(name: string) {
    const screenshotPath = path.join(this.testInfo.outputDir, `${name}.png`);
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    return screenshotPath;
  }

  async startVideoRecording() {
    // await this.page.video()?.start();
  }

  async stopVideoRecording(name: string) {
    // const video = this.page.video();
    // if (video) {
      // await video.stop();
      // const videoPath = await video.path();
      // if (videoPath) {
        // const newPath = path.join(this.testInfo.outputDir, `${name}.webm`);
        // await fs.promises.rename(videoPath, newPath);
        // return newPath;
      // }
    // }
    return null;
  }

  async captureNetworkLogs() {
    const logs: any[] = [];
    this.page.on('request', request => {
      logs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    this.page.on('response', response => {
      logs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    });

    return logs;
  }

  async saveConsoleLog(name: string) {
    const logs: string[] = [];
    this.page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    const logPath = path.join(this.testInfo.outputDir, `${name}-console.log`);
    await fs.promises.writeFile(logPath, logs.join('\n'));
    return logPath;
  }

  async capturePerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;
      
      return {
        loadTime: timing.loadEventEnd - navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        firstPaint: timing.responseStart - navigationStart,
        resourceCount: window.performance.getEntriesByType('resource').length
      };
    });

    return metrics;
  }
}