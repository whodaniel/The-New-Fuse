#!/usr/bin/env node
/* eslint-disable no-console */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = process.cwd();
const STATIC_DIR = path.join(ROOT, 'scripts/local-ui/static');
const DEFAULT_PORT = 1421;

function parseArgs(argv) {
  return {
    port: Number(process.env.TNF_BROWSER_CONTROL_PORT || DEFAULT_PORT),
    open: !argv.includes('--no-open'),
    skipRelay: argv.includes('--skip-relay'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function printUsage() {
  console.log('Usage: node scripts/local-ui/serve-browser-control.cjs [options]');
  console.log('');
  console.log('Serve standalone TNF browser control + federation HTML panel.');
  console.log('');
  console.log('Options:');
  console.log('  --skip-relay  Do not start relay-core in background');
  console.log('  --no-open     Do not open browser automatically');
  console.log('  -h, --help    Show help');
}

function openBrowser(url) {
  if (process.platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore' });
    return;
  }
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    return;
  }
  spawn('xdg-open', [url], { stdio: 'ignore' });
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'application/octet-stream';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.skipRelay) {
    spawn('pnpm', ['run', '-s', 'relay:start'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, RELAY_PORT: process.env.RELAY_PORT || '3000' },
      detached: true,
    }).unref();
  }

  const server = http.createServer((req, res) => {
    const urlPath = req.url?.split('?')[0] || '/';
    const relative = urlPath === '/' ? '/browser-control.html' : urlPath;
    const filePath = path.join(STATIC_DIR, relative);

    if (!filePath.startsWith(STATIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(args.port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${args.port}/`;
    console.log(`TNF browser control panel: ${url}`);
    if (args.open) openBrowser(url);
  });
}

main();
