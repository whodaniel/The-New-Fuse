import { TurboFactory } from '@ardrive/turbo-sdk';

// A simple p-limit equivalent for controlling concurrency
const pLimit = (concurrency) => {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = async (fn) => {
    activeCount++;
    try {
      return await fn();
    } finally {
      next();
    }
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      const task = () => run(fn).then(resolve).catch(reject);
      if (activeCount < concurrency) {
        task();
      } else {
        queue.push(task);
      }
    });
};

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

  const CONCURRENCY_LIMIT = parseInt(process.env.TURBO_UPLOAD_CONCURRENCY_LIMIT || '1', 10);
  const limit = pLimit(CONCURRENCY_LIMIT);
  console.log(`Uploading with a concurrency limit of ${CONCURRENCY_LIMIT}.`);

  const uploadPromises = filesToUpload.map((file) =>
    limit(async () => {
      if (!fs.existsSync(file.local_path)) {
        console.warn(`File ${file.local_path} is missing locally. Skipping upload.`);
        return { status: 'skipped', reason: 'file missing', file };
      }

      const actualSize = fs.statSync(file.local_path).size;
      if (actualSize > maxUploadSize) {
        console.warn(`File ${file.local_path} is ${actualSize} bytes, above max upload size. Skipping upload.`);
        return { status: 'skipped', reason: 'oversize', file };
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
        return { status: 'fulfilled', value: uploadResult.id, file };
      } catch (uploadErr) {
        console.error(`Failed to upload ${file.name}:`, uploadErr.message);
        return { status: 'rejected', reason: uploadErr, file };
      }
    })
  );

  await Promise.allSettled(uploadPromises);
  console.log('All upload tasks have completed.');
}
