'use strict';
// Synchronous JSON emission for scripts whose stdout is a pipe.
//
// Node makes pipe writes asynchronous on macOS (and Windows), so
// `console.log(bigString); process.exit()` loses everything past the kernel
// pipe buffer (64 KiB). The Codex lifecycle hook parses tnf-onboard-twip's
// `--json` output through exactly such a pipe and failed with
// "Unterminated string in JSON at position 64286" (2026-10-21). Writing with
// fs.writeSync drains the whole buffer before the process can exit.
const fs = require('node:fs');

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Write the whole string to fd synchronously; retries on EAGAIN (non-blocking pipes). */
function writeSyncAll(fd, text) {
  const buffer = Buffer.from(String(text), 'utf8');
  let offset = 0;
  let spins = 0;
  while (offset < buffer.length) {
    try {
      offset += fs.writeSync(fd, buffer, offset, buffer.length - offset);
      spins = 0;
    } catch (error) {
      if (error.code !== 'EAGAIN' || ++spins > 20000) throw error;
      sleepMs(1);
    }
  }
  return offset;
}

/** JSON.stringify(value, null, indent) + newline, written fully to fd (default stdout). */
function emitJsonSync(value, { fd = 1, indent = 2 } = {}) {
  return writeSyncAll(fd, `${JSON.stringify(value, null, indent)}\n`);
}

module.exports = { emitJsonSync, writeSyncAll };
