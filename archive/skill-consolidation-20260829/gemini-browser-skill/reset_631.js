const fs = require('fs');
const path = require('path');
const statePath =
  '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';

try {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const video = state.queue.find((v) => v.index === 631);
  if (video) {
    console.log('Found video 631. Current status:', video.status);
    video.status = 'transcript';
    video.processingAttempts = 0;
    delete video.error;
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log('Successfully reset video 631 to "transcript" status and 0 attempts.');
  } else {
    console.log('Video 631 not found in the queue.');
  }

  const video633 = state.queue.find((v) => v.index === 633);
  if (video633) {
    console.log('Found video 633. Current status:', video633.status);
    video633.status = 'transcript';
    video633.processingAttempts = 0;
    delete video633.error;
    console.log('Successfully reset video 633 to "transcript" status and 0 attempts.');
  }
} catch (error) {
  console.error('Error modifying state file:', error);
}
