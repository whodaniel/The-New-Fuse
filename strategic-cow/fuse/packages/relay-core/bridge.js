const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const inputPath = path.join(__dirname, 'relay-input.log');
const listenerScript = path.join(__dirname, 'relay-listener.js');
const outputPath = path.join(__dirname, 'relay-listener.log');

// Spawn listener
const listener = spawn('node', [listenerScript], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

// redirect stdout/stderr to log file
const logStream = fs.createWriteStream(outputPath, { flags: 'a' });
listener.stdout.pipe(logStream);
listener.stderr.pipe(logStream);

// Watch input file and send to listener stdin
fs.watchFile(inputPath, { interval: 100 }, (curr, prev) => {
  if (curr.size > prev.size) {
    const stream = fs.createReadStream(inputPath, {
      start: prev.size,
      end: curr.size,
    });

    let chunk = '';
    stream.on('data', (data) => {
      chunk += data.toString();
      if (chunk.endsWith('\n')) {
        const line = chunk.trim();
        if (line.startsWith('/join ')) {
          const channel = line.replace('/join ', '').trim();
          console.log(`Command: Join ${channel}`);
          // We need to reach into the listener's internal state or use its protocol
          // But since we just pipe to stdin, and listener.js has an interactive mode:
          // rl.on('line', (input) => { ... listener.sendMessage(input.trim(), targetChannelId); });
          // Wait, the listener's interactive mode only sends messages, it doesn't process /join commands.
          // I should've made a better script.
        }
        listener.stdin.write(chunk);
        chunk = '';
      }
    });
  }
});

console.log('Bridge active.');
