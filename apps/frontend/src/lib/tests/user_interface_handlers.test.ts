import { UserInterfaceHandlers } from '../handlers.js';

describe('UserInterfaceHandlers', () => {
  let uiHandlers;

  beforeEach(() => {
    uiHandlers = new UserInterfaceHandlers();
  });

  test('should start the browser correctly', async () => {
    // Mock fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );

    await uiHandlers.startBrowser();

    expect(uiHandlers.browserActive).toBe(true);
    expect(uiHandlers.browserStarting).toBe(false);
  });

  test('should handle browser start errors', async () => {
    // Mock fetch API to simulate an error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      })
    );

    await uiHandlers.startBrowser();

    expect(uiHandlers.browserActive).toBe(false);
    expect(uiHandlers.browserStarting).toBe(false);
  });

  test('should handle search command', async () => {
    uiHandlers.handleSearchCommand = jest.fn();
    await uiHandlers.handleCommand('search', 'test query');
    expect(uiHandlers.handleSearchCommand).toHaveBeenCalledWith('test query');
  });

  test('should handle browse command', async () => {
    uiHandlers.navigateTo = jest.fn();
    uiHandlers.browserActive = true;
    await uiHandlers.handleCommand('browse', 'https://example.com');
    expect(uiHandlers.navigateTo).toHaveBeenCalledWith('https://example.com');
  });

  test('should take a screenshot', async () => {
    uiHandlers.browserActive = true;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );
    await uiHandlers.takeScreenshot();
    expect(global.fetch).toHaveBeenCalledWith('/api/browser/screenshot', expect.any(Object));
  });

  // Add more tests for other methods
});
export {};
