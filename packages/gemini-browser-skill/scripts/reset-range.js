const fs = require('fs');
const path = require('path');

const STATE_FILE_PATH = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';

function reset() {
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  let resetCount = 0;
  
  for (const v of state.queue) {
    if (v.index >= 648 && v.index <= 683) {
      v.processingAttempts = 0;
      v.status = 'pending';
      resetCount++;
    }
  }

  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  console.log(`Reset ${resetCount} videos to pending.`);
}

reset();
