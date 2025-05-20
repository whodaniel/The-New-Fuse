import { UserInterfaceHandlers } from '../handlers.js';

describe('Browser Controls', () => {
  let uiHandlers;

  beforeEach(() => {
    uiHandlers = new UserInterfaceHandlers();
    uiHandlers.browserActive = true;
  });

  test('should navigate to given URL', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );

    await uiHandlers.navigateTo('https://example.com');

    expect(global.fetch).toHaveBeenCalledWith('/api/browser/navigate', expect.any(Object));
  });

  test('should handle navigation errors', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      })
    );

    await uiHandlers.navigateTo('https://example.com');

    // Verify that an error message is handled appropriately
    // This may involve checking if a toast message was shown
  });

  test('should go back in browser history', async () => {
    uiHandlers.updateNavigationState = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );
    await uiHandlers.browserBack();
    expect(global.fetch).toHaveBeenCalledWith('/api/browser/back', expect.any(Object));
    expect(uiHandlers.updateNavigationState).toHaveBeenCalled();
  });

  test('should go forward in browser history', async () => {
    uiHandlers.updateNavigationState = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );
    await uiHandlers.browserForward();
    expect(global.fetch).toHaveBeenCalledWith('/api/browser/forward', expect.any(Object));
    expect(uiHandlers.updateNavigationState).toHaveBeenCalled();
  });

  test('should refresh the browser', async () => {
    uiHandlers.updateNavigationState = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );
    await uiHandlers.browserRefresh();
    expect(global.fetch).toHaveBeenCalledWith('/api/browser/refresh', expect.any(Object));
    expect(uiHandlers.updateNavigationState).toHaveBeenCalled();
  });

  // Add more tests for takeScreenshot and other browser controls
});
export {};
