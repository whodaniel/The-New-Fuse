import { WebDriver } from 'selenium-webdriver';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

export class VisualRegression {
  private static readonly SCREENSHOTS_DIR = 'test-screenshots';
  private static readonly DIFFS_DIR = 'test-diffs';

  static async initialize(): Promise<void> {
    await fs.mkdir(this.SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(this.DIFFS_DIR, { recursive: true });
  }

  static async compareScreenshot(
    driver: WebDriver,
    name: string,
    threshold: number = 0.1
  ): Promise<boolean> {
    const screenshot = await driver.takeScreenshot();
    const screenshotBuffer = Buffer.from(screenshot, 'base64');
    
    const baselinePath = path.join(this.SCREENSHOTS_DIR, `${name}-baseline.png`);
    const diffPath = path.join(this.DIFFS_DIR, `${name}-diff.png`);

    try {
      const baseline = await fs.readFile(baselinePath);
      const img1 = PNG.sync.read(baseline);
      const img2 = PNG.sync.read(screenshotBuffer);

      const { width, height } = img1;
      const diff = new PNG({ width, height });

      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold }
      );

      const diffPercentage = (numDiffPixels / (width * height)) * 100;
      
      if (diffPercentage > threshold * 100) {
        await fs.writeFile(diffPath, PNG.sync.write(diff));
        logger.warn(`Visual difference detected for ${name}: ${diffPercentage.toFixed(2)}%`);
        return false;
      }
      
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        // Baseline doesn't exist, create it
        await fs.writeFile(baselinePath, screenshotBuffer);
        logger.info(`Created baseline for ${name}`);
        return true;
      }
      throw error;
    }
  }
}