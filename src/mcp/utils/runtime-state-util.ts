import fs from 'fs';
import path from 'path';

const RUNTIME_STATE_PATH = path.resolve(process.cwd(), '.agent/runtime-state.json');

export function getRuntimeState() {
  try {
    if (fs.existsSync(RUNTIME_STATE_PATH)) {
      const data = fs.readFileSync(RUNTIME_STATE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read runtime state:', e);
  }
  return null;
}
