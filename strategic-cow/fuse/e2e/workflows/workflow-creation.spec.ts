/**
 * Workflow Creation E2E Tests
 *
 * Tests the workflow creation and editing functionality.
 */

import { expect, test, type Page } from '@playwright/test';

async function gotoWithRetry(page: Page, url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(750);
    }
  }
  throw lastError;
}

test.describe('Workflow Creation', () => {
  test.beforeEach(async ({ page }) => {
    const userId = 'e2e-workflow-user-1';

    await page.addInitScript(
      ({ token, user }) => {
        window.localStorage.setItem('auth_token', token);
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
      },
      {
        token: 'e2e-workflow-auth-token',
        user: {
          id: userId,
          email: 'e2e-workflow@tnf.local',
          name: 'Workflow E2E User',
          role: 'USER',
          roles: ['USER'],
        },
      }
    );

    await page.route('**/auth/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: userId,
          email: 'e2e-workflow@tnf.local',
          name: 'Workflow E2E User',
          role: 'USER',
          roles: ['USER'],
        }),
      });
    });

    await page.route('**/api/workflows/executions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/workflows*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }
      await route.fallback();
    });

    // Navigate to workflows page
    await gotoWithRetry(page, '/workflows');
  });

  test('should open workflow canvas', async ({ page }) => {
    // Click the available entry point to builder from the current workflows UI.
    const createButton = page
      .getByRole('button', {
        name: /new workflow|create workflow|open builder|orchestrate new intelligence/i,
      })
      .first();
    await createButton.click();

    await expect(page).toHaveURL(/\/workflows\/builder/);

    // Check that ReactFlow canvas controls are visible in the builder.
    await expect(page.getByRole('button', { name: 'zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'fit view' })).toBeVisible();
  });

  test.skip('should add nodes to workflow', async ({ page }) => {
    // This is a placeholder - implement when workflow UI is ready
    await page.goto('/workflows/new');

    // Open node palette
    const paletteButton = page.getByRole('button', { name: /add node/i });
    await paletteButton.click();

    // Add a node
    const nodeType = page.getByText(/AI Agent/i);
    await nodeType.click();

    // Verify node was added
    const node = page.locator('[data-testid="workflow-node"]');
    await expect(node).toBeVisible();
  });

  test.skip('should save workflow', async ({ page }) => {
    // This is a placeholder - implement when workflow save is ready
    await page.goto('/workflows/new');

    // Fill in workflow name
    await page.fill('input[name="workflowName"]', 'Test Workflow');

    // Save workflow
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Verify success message
    await expect(page.getByText(/workflow saved/i)).toBeVisible();
  });
});
