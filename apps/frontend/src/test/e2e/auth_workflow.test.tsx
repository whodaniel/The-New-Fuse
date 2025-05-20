import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

describe('Authentication E2E Tests', () => {
  let driver: WebDriver;
  let devServer: ChildProcess;

  const waitForServer = async (url: string, timeout: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkServer = (): any => {
        http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        }).on('error', retry);

        function retry(): any {
          const elapsed = Date.now() - startTime;
          if (elapsed > timeout) {
            reject(new Error(`Server not ready after ${timeout}ms`));
          } else {
            setTimeout(checkServer, 1000);
          }
        }
      };

      checkServer();
    });
  };

  const waitForElement = async (selector: string, timeout = 10000): Promise<WebElement> => {
    return driver.wait(
      until.elementLocated(By.css(selector)),
      timeout,
      `Element ${selector} not found after ${timeout}ms`
    );
  };

  const takeScreenshotOnFailure = async (error: Error) => {
    console.error('Test failed:', error);
    const screenshot = await driver.takeScreenshot();
    :', screenshot);
    throw error;
  };

  beforeAll(async () => {
    // Kill any existing process on port 5173
    try {
      await new Promise((resolve) => {
        const kill = spawn('kill', [`$(lsof -t -i:5173)`], { shell: true });
        kill.on('close', resolve);
      });
    } catch (error) {
      
    }

    // Start the dev server with mock OAuth enabled
    devServer = spawn('yarn', ['dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: '5173',
        VITE_MOCK_OAUTH: 'true'
      }
    });

    await waitForServer('http://localhost:5173', 30000);

    // Configure headless Chrome
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  }, 90000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
    if (devServer) {
      devServer.kill('SIGTERM');
      try {
        await new Promise((resolve) => {
          const kill = spawn('kill', [`$(lsof -t -i:5173)`], { shell: true });
          kill.on('close', resolve);
        });
      } catch (error) {
        
      }
    }
  });

  beforeEach(async () => {
    await driver.get('http://localhost:5173/login');
    await waitForElement('[data-testid="login-page"]');
  });

  describe('OAuth Authentication Flows', () => {
    test('Google Sign-In Flow - Success Path', async () => {
      try {
        const googleButton = await waitForElement('[data-testid="google-signin-button"]');
        await googleButton.click();

        // Verify loading state
        const loadingSpinner = await waitForElement('[data-testid="google-signin-loading"]');
        expect(await loadingSpinner.isDisplayed()).toBe(true);

        // Wait for and verify mock OAuth page
        const mockOAuthPage = await waitForElement('[data-testid="mock-oauth-page"]');
        expect(await mockOAuthPage.isDisplayed()).toBe(true);

        // Fill mock OAuth form
        const emailInput = await waitForElement('[data-testid="mock-oauth-email"]');
        await emailInput.sendKeys('test@example.com');
        
        const authorizeButton = await waitForElement('[data-testid="mock-oauth-authorize"]');
        await authorizeButton.click();

        // Verify redirect to dashboard
        const dashboard = await waitForElement('[data-testid="dashboard"]');
        expect(await dashboard.isDisplayed()).toBe(true);

        // Verify user menu and profile info
        const userMenu = await waitForElement('[data-testid="user-menu"]');
        expect(await userMenu.isDisplayed()).toBe(true);
        
        await userMenu.click();
        const userEmail = await waitForElement('[data-testid="user-email"]');
        expect(await userEmail.getText()).toBe('test@example.com');
      } catch (error) {
        await takeScreenshotOnFailure(error);
      }
    }, 45000);

    test('GitHub Sign-In Flow - Success Path', async () => {
      try {
        const githubButton = await waitForElement('[data-testid="github-signin-button"]');
        await githubButton.click();

        // Verify loading state
        const loadingSpinner = await waitForElement('[data-testid="github-signin-loading"]');
        expect(await loadingSpinner.isDisplayed()).toBe(true);

        // Wait for and verify mock OAuth page
        const mockOAuthPage = await waitForElement('[data-testid="mock-oauth-page"]');
        expect(await mockOAuthPage.isDisplayed()).toBe(true);

        // Fill mock OAuth form
        const usernameInput = await waitForElement('[data-testid="mock-oauth-username"]');
        await usernameInput.sendKeys('testuser');
        
        const authorizeButton = await waitForElement('[data-testid="mock-oauth-authorize"]');
        await authorizeButton.click();

        // Verify redirect to dashboard
        const dashboard = await waitForElement('[data-testid="dashboard"]');
        expect(await dashboard.isDisplayed()).toBe(true);

        // Verify user menu and profile info
        const userMenu = await waitForElement('[data-testid="user-menu"]');
        expect(await userMenu.isDisplayed()).toBe(true);
        
        await userMenu.click();
        const username = await waitForElement('[data-testid="user-name"]');
        expect(await username.getText()).toBe('testuser');
      } catch (error) {
        await takeScreenshotOnFailure(error);
      }
    }, 45000);

    test('OAuth Error Handling - Access Denied', async () => {
      try {
        // Simulate access denied error
        await driver.get('http://localhost:5173/auth/callback?error=access_denied');

        // Verify error message
        const errorAlert = await waitForElement('[data-testid="auth-error-alert"]');
        expect(await errorAlert.getText()).toContain('Authentication failed');

        // Verify back on login page
        const loginPage = await waitForElement('[data-testid="login-page"]');
        expect(await loginPage.isDisplayed()).toBe(true);
      } catch (error) {
        await takeScreenshotOnFailure(error);
      }
    }, 30000);

    test('OAuth Error Handling - Network Error', async () => {
      try {
        // Simulate network error by using invalid callback URL
        await driver.get('http://localhost:5173/auth/callback?error=network_error');

        // Verify error message
        const errorAlert = await waitForElement('[data-testid="auth-error-alert"]');
        expect(await errorAlert.getText()).toContain('Network error occurred');

        // Verify retry button
        const retryButton = await waitForElement('[data-testid="auth-retry-button"]');
        expect(await retryButton.isDisplayed()).toBe(true);
      } catch (error) {
        await takeScreenshotOnFailure(error);
      }
    }, 30000);

    test('Session Persistence', async () => {
      try {
        // Complete successful login
        const googleButton = await waitForElement('[data-testid="google-signin-button"]');
        await googleButton.click();

        const emailInput = await waitForElement('[data-testid="mock-oauth-email"]');
        await emailInput.sendKeys('test@example.com');
        
        const authorizeButton = await waitForElement('[data-testid="mock-oauth-authorize"]');
        await authorizeButton.click();

        // Verify logged in state
        await waitForElement('[data-testid="dashboard"]');

        // Refresh page
        await driver.navigate().refresh();

        // Verify still logged in
        const dashboard = await waitForElement('[data-testid="dashboard"]');
        expect(await dashboard.isDisplayed()).toBe(true);

        // Verify user menu still accessible
        const userMenu = await waitForElement('[data-testid="user-menu"]');
        expect(await userMenu.isDisplayed()).toBe(true);
      } catch (error) {
        await takeScreenshotOnFailure(error);
      }
    }, 60000);

    test('Logout Flow', async () => {
      try {
        // Complete login first
        const googleButton = await waitForElement('[data-testid="google-signin-button"]');
        await googleButton.click();

        const emailInput = await waitForElement('[data-testid="mock-oauth-email"]');
        await emailInput.sendKeys('test@example.com');
        
        const authorizeButton = await waitForElement('[data-testid="mock-oauth-authorize"]');
        await authorizeButton.click();

        // Wait for dashboard
        await waitForElement('[data-testid="dashboard"]');

        // Click user menu
        const userMenu = await waitForElement('[data-testid="user-menu"]');
        await userMenu.click();

        // Click logout
        const logoutButton = await waitForElement('[data-testid="logout-button"]');
        await logoutButton.click();

        // Verify redirect to login page
        const loginPage = await waitForElement('[data-testid="login-page"]');
        expect(await loginPage.isDisplayed()).toBe(true);

        // Verify session cleared by trying to access dashboard
        await driver.get('http://localhost:5173/dashboard');
        
        // Should be redirected back to login
        await waitForElement('[data-testid="login-page"]');
      } catch (error) {
        await takeScreenshotOnFailure(error);
      }
    }, 60000);
  });
});

export {};
