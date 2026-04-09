const fs = require('fs');
const path =
  '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';

if (fs.existsSync(path)) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  let count = 0;

  if (data.queue) {
    data.queue.forEach((v) => {
      // Reset logic: if not completed and has attempts, or is in error/skipped state
      if (
        v.status !== 'completed' &&
        (v.processingAttempts > 0 || v.status === 'skipped' || v.status === 'error')
      ) {
        v.processingAttempts = 0;
        v.status = 'pending';
        v.error = undefined;
        count++;
      }
    });
  }

  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Reset ${count} videos in ` + path);
} else {
  console.log('File not found: ' + path);
}
