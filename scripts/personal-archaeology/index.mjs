import { closeDb, initDb } from './db.mjs';
import { authorize, syncMetadata, downloadPending } from './google-drive.mjs';
import { uploadToArweave } from './ardrive-turbo.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const DEFAULT_FREE_TURBO_LIMIT_BYTES = 100 * 1024;

function parseByteLimit(name, defaultValue) {
  const rawValue = process.env[name];
  if (!rawValue) return defaultValue;
  if (rawValue.toLowerCase() === 'infinity') return Number.MAX_SAFE_INTEGER;
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer byte count or "Infinity".`);
  }
  return parsed;
}

const config = {
  dryRun: process.env.DRY_RUN !== '0',
  uploadEnabled: process.env.PERSONAL_ARCHAEOLOGY_UPLOAD === '1',
  maxDownloadSize: parseByteLimit('MAX_DOWNLOAD_SIZE_BYTES', DEFAULT_FREE_TURBO_LIMIT_BYTES),
  maxUploadSize: parseByteLimit('MAX_UPLOAD_SIZE_BYTES', DEFAULT_FREE_TURBO_LIMIT_BYTES),
};

async function runPipeline() {
  console.log('--- TNF Personal Archaeology Pipeline ---');
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE DOWNLOAD'}; upload enabled: ${config.uploadEnabled}`);
  console.log(`Max download size: ${config.maxDownloadSize} bytes; max upload size: ${config.maxUploadSize} bytes`);
  
  // 1. Initialize SQLite Database
  console.log('Initializing tracking database...');
  await initDb();
  
  // 2. Google Drive Sync & Download
  console.log('Authenticating with Google Drive...');
  let auth;
  try {
    auth = await authorize();
  } catch (err) {
    console.error('Google Drive Auth Error:', err.message);
    console.error('Please configure your credentials.json and generate token.json');
    process.exit(1);
  }

  // Phase 1: Metadata Sync
  await syncMetadata(auth);

  // Phase 2: Download files
  await downloadPending(auth, DOWNLOAD_DIR, {
    maxDownloadSize: config.maxDownloadSize,
    dryRun: config.dryRun,
  });

  // Phase 3: TODO Multimodal Indexing
  // Extracted texts, frames, and AI metadata tags would be generated here
  // and stored into `metadata` table.

  // Phase 4: ArDrive Upload
  console.log('Starting ArDrive Turbo Uploads...');
  try {
    await uploadToArweave({
      maxUploadSize: config.maxUploadSize,
      dryRun: config.dryRun,
      uploadEnabled: config.uploadEnabled,
    });
  } catch (err) {
    console.error('ArDrive Upload Error:', err.message);
  }

  console.log('Pipeline run complete.');
}

runPipeline()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
