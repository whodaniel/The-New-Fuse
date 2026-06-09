import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import {
  getDownloadCandidateCount,
  getOversizeDownloadCount,
  getPendingDownloads,
  getZeroSizePendingCount,
  insertFile,
  markDownloadFailed,
  markDownloaded,
  markSkipped,
} from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || path.join(__dirname, 'credentials.json');
const TOKEN_PATH = process.env.GOOGLE_DRIVE_TOKEN_PATH || path.join(__dirname, 'token.json');
const GOOGLE_APPS_MIME_PREFIX = 'application/vnd.google-apps.';

function safeFilename(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[/:\\]/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 180) || 'unnamed';
}

export async function authorize() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Missing Google Drive credentials.json at ${CREDENTIALS_PATH}`);
  }
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Missing Google Drive token.json at ${TOKEN_PATH}. Please run the auth script first.`);
  }

  const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
  oAuth2Client.setCredentials(JSON.parse(token));
  return oAuth2Client;
}

export async function syncMetadata(auth) {
  const drive = google.drive({ version: 'v3', auth });
  console.log('Fetching file metadata from Google Drive...');
  
  let pageToken = null;
  let totalSaved = 0;
  
  do {
    const res = await drive.files.list({
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum)',
      pageToken: pageToken,
      q: 'trashed = false',
    });
    
    const files = res.data.files;
    if (files.length) {
      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          continue;
        }

        if (file.mimeType?.startsWith(GOOGLE_APPS_MIME_PREFIX)) {
          await insertFile({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size || 0,
            md5Checksum: file.md5Checksum || '',
          });
          await markSkipped(file.id, 'google-workspace-export-not-implemented');
          continue;
        }

        const changes = await insertFile({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size || 0,
          md5Checksum: file.md5Checksum || '',
        });
        totalSaved += changes;
      }
      console.log(`Processed ${files.length} files. Total new saved: ${totalSaved}`);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log('Finished syncing metadata.');
}

export async function downloadPending(auth, downloadDir, { maxDownloadSize, dryRun }) {
  const drive = google.drive({ version: 'v3', auth });
  const pendingFiles = await getPendingDownloads(maxDownloadSize);
  const totalCandidates = await getDownloadCandidateCount(maxDownloadSize);
  const oversizeCount = await getOversizeDownloadCount(maxDownloadSize);
  const zeroSizeCount = await getZeroSizePendingCount();
  
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log(`Download candidates <= ${maxDownloadSize} bytes: ${totalCandidates}`);
  console.log(`Pending files skipped by size: ${oversizeCount}; pending zero-size/export-only files: ${zeroSizeCount}`);

  if (dryRun) {
    console.log(`DRY RUN: would download ${pendingFiles.length} files into ${downloadDir}`);
    return;
  }

  console.log(`Starting download of ${pendingFiles.length} pending files...`);

  for (const file of pendingFiles) {
    console.log(`Downloading ${file.name} (${file.id})...`);
    try {
      const destPath = path.join(downloadDir, `${file.id}_${safeFilename(file.name)}`);
      const dest = fs.createWriteStream(destPath);
      
      const res = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'stream' }
      );

      await pipeline(res.data, dest);

      await markDownloaded(file.id, destPath);
      console.log(`Successfully downloaded ${file.name}`);
    } catch (err) {
      console.error(`Failed to download ${file.name}:`, err.message);
      await markDownloadFailed(file.id, err.message);
    }
  }
}
