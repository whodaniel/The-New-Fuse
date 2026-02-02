/**
 * The New Fuse - AI Studio Configuration
 *
 * Data directory configuration for video processing
 */

import * as path from 'path';

const TNF_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const DATA_DIR = process.env.TNF_DATA_DIR || path.join(TNF_ROOT, 'data', 'ai-studio');

export const config = {
  dataDir: DATA_DIR,
  reportsDir: path.join(DATA_DIR, 'reports'),
  transcriptsDir: path.join(DATA_DIR, 'transcripts'),
  libraryFile: path.join(DATA_DIR, 'video-library.html'),
  progressFile: path.join(DATA_DIR, 'processing-progress.json'),
  knowledgeBase: path.join(DATA_DIR, 'knowledge-base.md'),
};

export default config;
