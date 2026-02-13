const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const inputPath = path.join(__dirname, 'relay-input.log');
const listenerScript = path.join(__dirname, 'relay-listener.js');
const outputPath = path.join(__dirname, 'relay-listener.log');

// Spawn listener
const listener = spawn('node', [listenerScript, 'TNF Alpha 1'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

// redirect stdout/stderr to log file
const logStream = fs.createWriteStream(outputPath, { flags: 'a' });
listener.stdout.pipe(logStream);
listener.stderr.pipe(logStream);

// Watch input file and send to listener stdin
let lastSize = fs.statSync(inputPath).size;

fs.watchFile(inputPath, { interval: 100 }, (curr, prev) => {
  if (curr.size > prev.size) {
    const stream = fs.createReadStream(inputPath, {
      start: prev.size,
      end: curr.size,
    });
    stream.pipe(listener.stdin, { end: false });
  }
});

console.log('Bridge active. Monitoring relay-input.log -> relay-listener -> relay-listener.log');
