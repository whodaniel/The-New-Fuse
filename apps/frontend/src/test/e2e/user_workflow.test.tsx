import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

describe('User Workflow E2E Tests', () => {
  let driver: WebDriver;
  let devServer: ChildProcess;

  const waitForServer = (url: string, timeout: number): Promise<void> => {
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

  beforeAll(async () => {
    // Kill any existing process on port 5173
    try {
      await new Promise((resolve) => {
        const kill = spawn('kill', [`$(lsof -t -i:5173)`], { shell: true });
        kill.on('close', resolve);
      });
    } catch (error) {
      
    }

    // Start the dev server
    devServer = spawn('yarn', ['dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: '5173'
      }
    });

    // Wait for server to be ready
    try {
      
      await waitForServer('http://localhost:5173', 30000);
      
    } catch (error) {
      console.error('Failed to start dev server:', error);
      throw error;
    }

    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');

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
      // Also kill any remaining process on port 5173
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
    try {
      await driver.get('http://localhost:5173');
      // Wait for app to be fully loaded - adjust selector based on your app
      await driver.wait(
        until.elementLocated(By.css('#root')), // or another reliable root element
        30000,
        'App root element not found'
      );
      
    } catch (error) {
      console.error('Error loading page:', error);
      const screenshot = await driver.takeScreenshot();
      :', screenshot);
      throw error;
    }
  });

  test('should load the homepage', async () => {
    const title = await driver.getTitle();
    expect(title).toBeTruthy();
  }, 30000);

  test('complete user registration flow', async () => {
    try {
      // Wait for any loading states to complete
      await driver.sleep(2000);

      // Fill in registration form
      const nameInput = await driver.wait(
        until.elementLocated(By.css('[data-testid="name-input"]')),
        30000,
        'Name input not found'
      );
      await nameInput.sendKeys('Test User');

      const emailInput = await driver.wait(
        until.elementLocated(By.css('[data-testid="email-input"]')),
        30000,
        'Email input not found'
      );
      await emailInput.sendKeys('test@example.com');

      const passwordInput = await driver.wait(
        until.elementLocated(By.css('[data-testid="password-input"]')),
        30000,
        'Password input not found'
      );
      await passwordInput.sendKeys('password123');

      const confirmPasswordInput = await driver.wait(
        until.elementLocated(By.css('[data-testid="confirm-password-input"]')),
        30000,
        'Confirm password input not found'
      );
      await confirmPasswordInput.sendKeys('password123');

      // Submit form
      const submitButton = await driver.wait(
        until.elementLocated(By.css('[data-testid="register-submit-button"]')),
        30000,
        'Submit button not found'
      );
      await submitButton.click();

      // Wait for navigation to login page
      await driver.wait(
        until.elementLocated(By.css('[data-testid="login-link"]')),
        30000,
        'Not redirected to login page'
      );
    } catch (error) {
      console.error('Registration flow error:', error);
      const screenshot = await driver.takeScreenshot();
      :', screenshot);
      throw error;
    }
  }, 45000);

  test('user login and navigation', async () => {
    try {
      // Wait for any loading states
      await driver.sleep(2000);

      const emailInput = await driver.wait(
        until.elementLocated(By.css([
          '[data-testid="email-input"]',
          'input[type="email"]',
          '#email',
          '.email-input'
        ].join(','))),
        30000,
        'Email input not found after 30 seconds'
      );
      
      await driver.wait(
        until.elementIsVisible(emailInput),
        10000,
        'Email input is not visible'
      );
      
      );
      
      await emailInput.sendKeys('test@example.com');
    } catch (error) {
      console.error('Login flow error:', error);
      const screenshot = await driver.takeScreenshot();
      :', screenshot);
      throw error;
    }
  }, 45000);

  test('browser control workflow', async () => {
    try {
      await driver.sleep(2000);

      const emailInput = await driver.wait(
        until.elementLocated(By.css([
          '[data-testid="email-input"]',
          'input[type="email"]',
          '#email',
          '.email-input'
        ].join(','))),
        30000,
        'Email input not found after 30 seconds'
      );
      
      await driver.wait(
        until.elementIsVisible(emailInput),
        10000,
        'Email input is not visible'
      );
      
      );
      
      await emailInput.sendKeys('test@example.com');
    } catch (error) {
      console.error('Browser control flow error:', error);
      const screenshot = await driver.takeScreenshot();
      :', screenshot);
      throw error;
    }
  }, 45000);
});

export {};
