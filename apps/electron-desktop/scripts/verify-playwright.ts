import { PlaywrightService } from '../src/main/PlaywrightService';

async function main() {
  console.log('Starting Playwright verification test...');
  const service = new PlaywrightService();
  try {
    await service.initialize();
    await service.openUrl('https://example.com');
    console.log('Successfully navigated to example.com');
    // Wait a bit to simulate viewing
    await new Promise((r) => setTimeout(r, 2000));
    await service.close();
    console.log('Test PASSED: Playwright automated browser interaction successful.');
  } catch (e) {
    console.error('Test FAILED:', e);
    process.exit(1);
  }
}

main();
