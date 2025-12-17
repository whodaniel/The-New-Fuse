const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const binaryPath = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop/release/mac/The New Fuse.app/Contents/MacOS/The New Fuse';

  if (!fs.existsSync(binaryPath)) {
      console.error('Binary not found at:', binaryPath);
      process.exit(1);
  }

  console.log('🚀 Launching app from: ' + binaryPath);

  try {
    const app = await electron.launch({
      executablePath: binaryPath
    });

    console.log('✅ App launched successfully!');

    const page = await app.firstWindow();
    console.log('✅ Main window found.');
    console.log('📄 Title:', await page.title());

    // Wait for the UI to be ready
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'app-launch-screenshot.png' });
    console.log('📸 Screenshot taken');

    console.log('Closing app...');
    await app.close();
    console.log('🎉 Test Passed!');
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  }
})();
