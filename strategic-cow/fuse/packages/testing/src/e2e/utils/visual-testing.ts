import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export class VisualTesting {
  constructor(
    private page: Page,
    private testInfo: any,
    private snapshotsDir = 'visual-snapshots'
  ) {}

  private getSnapshotPath(name: string) {
    return path.join(this.snapshotsDir, `${name}.png`);
  }

  async compareScreenshot(name: string, locator?: string, threshold = 0.1) {
    const snapshotPath = this.getSnapshotPath(name);
    
    // Take new screenshot
    const screenshot = locator
      ? await this.page.locator(locator).screenshot()
      : await this.page.screenshot();
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }

    // If baseline doesn't exist, create it
    if (!fs.existsSync(snapshotPath)) {
      fs.writeFileSync(snapshotPath, screenshot);
      this.testInfo.annotations.push({
        type: 'info',
        description: `Created new baseline for ${name}`
      });
      return;
    }

    // Compare with baseline
    const baseline = fs.readFileSync(snapshotPath);
    await (expect(screenshot) as any).toMatchSnapshot(baseline, {
      threshold,
      maxDiffPixelRatio: 0.1
    });
  }

  async updateBaseline(name: string, locator?: string) {
    const screenshot = locator
      ? await this.page.locator(locator).screenshot()
      : await this.page.screenshot();
    
    const snapshotPath = this.getSnapshotPath(name);
    fs.writeFileSync(snapshotPath, screenshot);
  }

  async compareElement(selector: string, name: string) {
    await this.compareScreenshot(
      `${name}-element`,
      selector,
      0.05 // Stricter threshold for specific elements
    );
  }

  async compareFullPage(name: string) {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.compareScreenshot(`${name}-full`, undefined, 0.1);
  }

  async compareResponsive(name: string, viewports = [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 375, height: 812 }
  ]) {
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.compareScreenshot(
        `${name}-${viewport.width}x${viewport.height}`,
        undefined,
        0.1
      );
    }
  }

  async captureInteractionStates(
    selector: string,
    name: string,
    states = ['hover', 'focus', 'active']
  ) {
    const element = this.page.locator(selector);
    
    // Capture default state
    await this.compareElement(selector, `${name}-default`);
    
    // Capture each interaction state
    for (const state of states) {
      switch (state) {
        case 'hover':
          await element.hover();
          break;
        case 'focus':
          await element.focus();
          break;
        case 'active':
          await element.click({ noWaitAfter: true });
          break;
      }
      await this.compareElement(selector, `${name}-${state}`);
    }
  }
}