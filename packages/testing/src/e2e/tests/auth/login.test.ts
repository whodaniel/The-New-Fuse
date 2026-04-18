import { test, expect } from '../../fixtures/test.fixture.js';

test.describe('Authentication Flow', () => {
  test('should successfully login with valid credentials', async ({ loginPage }) => {
    await loginPage.navigateToLogin();
    await loginPage.login('testuser', 'testpass');
    
    expect(await loginPage.isLoggedIn()).toBeTruthy();
  });

  test('should show error message with invalid credentials', async ({ loginPage }) => {
    await loginPage.navigateToLogin();
    await loginPage.login('invalid', 'wrong');
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(await loginPage.isLoggedIn()).toBeFalsy();
  });

  test('should persist session with remember me', async ({ loginPage, page }) => {
    await loginPage.navigateToLogin();
    await loginPage.login('testuser', 'testpass', true);
    
    // Verify login successful
    expect(await loginPage.isLoggedIn()).toBeTruthy();
    
    // Create new context to verify persistence
    await page.context().close();
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();
    if (newPage) {
      await newPage.goto('/');
      expect(await newPage.url()).not.toContain('/login');
    }
  });
});