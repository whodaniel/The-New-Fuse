/**
 * Live CLI --sync-api check against an in-process Nest-shaped mock.
 */
import * as http from 'node:http';
import { spawn } from 'node:child_process';

async function main(): Promise<void> {
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      if (req.method === 'POST' && req.url === '/api/workflows') {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
            name: 'ok',
          })
        );
        return;
      }
      res.writeHead(404);
      res.end('no');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;

  const env = { ...process.env, TNF_API_URL: `http://127.0.0.1:${port}` };
  const child = spawn(
    'pnpm',
    [
      'exec',
      'tsx',
      'packages/tnf-cli/src/cli.ts',
      '--no-splash',
      'durable-tasks',
      'apply-workflow',
      '--prompt',
      'CLI sync demo',
      '--sync-api',
      '--json',
    ],
    { env, cwd: process.cwd() }
  );

  let out = '';
  child.stdout.on('data', (d) => {
    out += d;
  });
  child.stderr.on('data', (d) => {
    out += d;
  });
  const code = await new Promise<number>((resolve) => child.on('close', (c) => resolve(c ?? 1)));
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));

  const jsonStart = out.indexOf('{');
  if (jsonStart < 0) {
    console.error(out);
    process.exit(1);
  }
  const j = JSON.parse(out.slice(jsonStart));
  console.log(
    JSON.stringify(
      {
        code,
        apiSynced: j.apiSynced,
        apiId: j.apiId,
        builderPath: j.builderPath,
        method: j.apiSync?.method,
      },
      null,
      2
    )
  );
  if (!j.apiSynced || j.apiId !== 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee') process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
