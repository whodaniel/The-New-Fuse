import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { auditRoutes } from './audit-all-routes-semantic.mjs';

test('real browser interruption retries once, preserves HTTP failures, and isolates later routes', async () => {
  const server = createServer((req, res) => {
    res.statusCode = req.url === '/missing' ? 404 : 200;
    res.setHeader('content-type', 'text/html');
    if (req.url === '/set-state') res.setHeader('set-cookie', 'audit_state=previous_route; Path=/');
    res.end('<!doctype html><h1>Audit browser lifecycle fixture</h1>');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const attempts = new Map();
  try {
    const result = await auditRoutes(['/recover', '/missing', '/closed', '/set-state', '/after'], async (page, route) => {
      attempts.set(route, (attempts.get(route) || 0) + 1);
      if (route === '/after') assert.deepEqual(await page.context().cookies(), []);
      if ((route === '/recover' && attempts.get(route) === 1) || route === '/closed') {
        await page.context().browser().close();
      }
      try {
        const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 5000 });
        return { route, status: response.status(), error: null };
      } catch (error) {
        return { route, status: null, error: error.message };
      }
    });
    assert.equal(result.rows.length, 5);
    assert.deepEqual(result.rows[0], { route: '/recover', status: 200, error: null, attempts: 2 });
    assert.deepEqual(result.rows[1], { route: '/missing', status: 404, error: null, attempts: 1 });
    assert.equal(attempts.get('/closed'), 2);
    assert.match(result.rows[2].error, /closed/);
    assert.equal(result.rows[4].status, 200);
    assert.equal(result.browserInterruptions.length, 3);
    assert.equal(result.browserInterruptions.filter((event) => event.retried).length, 2);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
