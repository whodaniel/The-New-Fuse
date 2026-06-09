import { TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getOversizeUploadCount,
  getUploadableCount,
  getUploadableFiles,
  updateArweaveTxid,
} from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WALLET_PATH = process.env.ARWEAVE_WALLET_PATH || path.join(__dirname, 'wallet.json');

export async function uploadToArweave({ maxUploadSize, dryRun, uploadEnabled }) {
  const uploadableCount = await getUploadableCount(maxUploadSize);
  const oversizeCount = await getOversizeUploadCount(maxUploadSize);
  console.log(`Upload candidates <= ${maxUploadSize} bytes: ${uploadableCount}`);
  console.log(`Completed downloads skipped by upload size: ${oversizeCount}`);

  if (dryRun || !uploadEnabled) {
    console.log('DRY RUN: upload disabled. Set PERSONAL_ARCHAEOLOGY_UPLOAD=1 and DRY_RUN=0 to upload permanently.');
    return;
  }

  if (!fs.existsSync(WALLET_PATH)) {
    throw new Error(`Missing Arweave wallet at ${WALLET_PATH}. Cannot upload to ArDrive.`);
  }

  const wallet = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf-8'));
  const turbo = TurboFactory.authenticated({ privateKey: wallet });
  const filesToUpload = await getUploadableFiles(maxUploadSize);

  console.log(`Found ${filesToUpload.length} files ready for upload.`);

  for (const file of filesToUpload) {
    if (!fs.existsSync(file.local_path)) {
      console.warn(`File ${file.local_path} is missing locally. Skipping upload.`);
      continue;
    }

    const actualSize = fs.statSync(file.local_path).size;
    if (actualSize > maxUploadSize) {
      console.warn(`File ${file.local_path} is ${actualSize} bytes, above max upload size. Skipping upload.`);
      continue;
    }

    console.log(`Uploading ${file.name} to Arweave via Turbo...`);
    try {
      const uploadResult = await turbo.uploadFile({
        fileStreamFactory: () => fs.createReadStream(file.local_path),
        fileSizeFactory: () => actualSize,
        dataItemOpts: {
          tags: [
            { name: 'Content-Type', value: file.mime_type || 'application/octet-stream' },
            { name: 'File-Name', value: file.name },
            { name: 'App-Name', value: 'TNF-Personal-Archaeology' },
            { name: 'Google-Drive-ID', value: file.id }
          ],
        }
      });

      console.log(`Upload successful for ${file.name}. TxID: ${uploadResult.id}`);
      await updateArweaveTxid(file.id, uploadResult.id);
    } catch (uploadErr) {
      console.error(`Failed to upload ${file.name}:`, uploadErr.message);
    }
  }
}
