import { expect, test } from '@playwright/test';

test.describe('Personal Timeline', () => {
  test('supports add, edit, and delete for a personal timeline point', async ({ page }) => {
    const createdTitle = `Milestone ${Date.now()}`;
    const updatedTitle = `${createdTitle} Updated`;
    const userId = 'e2e-user-1';
    let events: Array<{
      id: string;
      userId: string;
      actor: string;
      eventType: string;
      timestamp: string;
      payload: Record<string, unknown>;
    }> = [];

    await page.addInitScript(
      ({ token, user }) => {
        window.localStorage.setItem('auth_token', token);
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
      },
      {
        token: 'e2e-auth-token',
        user: {
          id: userId,
          email: 'e2e@tnf.local',
          name: 'E2E User',
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
          email: 'e2e@tnf.local',
          name: 'E2E User',
          role: 'USER',
          roles: ['USER'],
        }),
      });
    });

    await page.route('**/api/timeline/events/*', async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      const id = url.pathname.split('/').pop() || '';
      const idx = events.findIndex((e) => e.id === id);

      if (method === 'PATCH') {
        if (idx < 0) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
          return;
        }
        const body = (request.postDataJSON() || {}) as {
          userId?: string;
          actor?: string;
          timestamp?: string;
          payload?: Record<string, unknown>;
        };
        if (body.userId && body.userId !== events[idx].userId) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
          return;
        }
        events[idx] = {
          ...events[idx],
          actor: body.actor || events[idx].actor,
          timestamp: body.timestamp || events[idx].timestamp,
          payload: body.payload ? { ...events[idx].payload, ...body.payload } : events[idx].payload,
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(events[idx]),
        });
        return;
      }

      if (method === 'DELETE') {
        if (idx < 0) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: 'false' });
          return;
        }
        const queryUserId = url.searchParams.get('userId') || '';
        if (queryUserId && queryUserId !== events[idx].userId) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: 'false' });
          return;
        }
        events = events.filter((e) => e.id !== id);
        await route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/timeline/events**', async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === 'GET') {
        const filterUserId = url.searchParams.get('userId');
        const filtered = filterUserId ? events.filter((e) => e.userId === filterUserId) : events;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filtered),
        });
        return;
      }

      if (method === 'POST') {
        const body = (request.postDataJSON() || {}) as {
          userId?: string;
          actor?: string;
          eventType?: string;
          timestamp?: string;
          payload?: Record<string, unknown>;
        };
        const created = {
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          userId: body.userId || userId,
          actor: body.actor || userId,
          eventType: body.eventType || 'historical_event',
          timestamp: body.timestamp || new Date().toISOString(),
          payload: body.payload || {},
        };
        events.push(created);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/timeline', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'My Timeline' })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByTestId('timeline-create-card')).toBeVisible();

    await page.getByTestId('timeline-create-title').fill(createdTitle);
    await page
      .getByTestId('timeline-create-description')
      .fill('Personal timeline milestone created from e2e automation.');

    await page.getByTestId('timeline-create-point').evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = '30';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.getByTestId('timeline-create-submit').click();

    await expect(page.getByTestId('timeline-selected-title')).toHaveText(createdTitle);

    await page.getByTestId('timeline-edit-selected').click();
    await expect(page.getByTestId('timeline-edit-title')).toBeVisible();
    await page.getByTestId('timeline-edit-title').fill(updatedTitle);
    await page
      .getByTestId('timeline-edit-description')
      .fill('Updated details for this personal timeline milestone.');
    await page.getByTestId('timeline-edit-point').evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = '75';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.getByTestId('timeline-edit-save').click();

    await expect(page.getByTestId('timeline-selected-title')).toHaveText(updatedTitle);

    await page.getByTestId('timeline-delete-selected').click();
    await expect(
      page.getByText('No selected point. Add one below to start your timeline.')
    ).toBeVisible();
  });
});
