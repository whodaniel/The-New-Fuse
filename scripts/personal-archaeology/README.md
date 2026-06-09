# Personal Archaeology Pipeline

This script orchestrates extraction, indexing, and optional permanent archiving of selected Google Drive data to ArDrive via Turbo.

By default, it runs in **dry-run mode** and does not download or upload files. Permanent uploads require explicit opt-in.

## Prerequisites

1. **Google Drive API Credentials:**
   - You must create a Google Cloud Project with the Google Drive API enabled.
   - Create an OAuth 2.0 Client ID (Desktop app) and download the credentials JSON.
   - Save the file as `credentials.json` in this directory, or set `GOOGLE_DRIVE_CREDENTIALS_PATH=/absolute/path/to/credentials.json`.
   - Run `node generate-token.mjs` to generate `token.json`, or set `GOOGLE_DRIVE_TOKEN_PATH=/absolute/path/to/token.json`.

2. **Arweave Wallet:**
   - Place your Arweave JWK wallet file as `wallet.json` in this directory, or set `ARWEAVE_WALLET_PATH=/absolute/path/to/wallet.json`.
   - Keep this wallet private. `credentials.json`, `token.json`, `wallet.json`, downloads, and SQLite files are gitignored.
   - Ensure the wallet has sufficient Turbo Credits if you raise the upload limit past 100 KiB.

## Usage

Preview what would happen:

```bash
node index.mjs
```

Download files up to the subsidized Turbo limit, but do not upload:

```bash
DRY_RUN=0 node index.mjs
```

Download and permanently upload files up to 100 KiB:

```bash
DRY_RUN=0 PERSONAL_ARCHAEOLOGY_UPLOAD=1 node index.mjs
```

Raise limits only after funding Turbo Credits:

```bash
DRY_RUN=0 PERSONAL_ARCHAEOLOGY_UPLOAD=1 MAX_DOWNLOAD_SIZE_BYTES=104857600 MAX_UPLOAD_SIZE_BYTES=104857600 node index.mjs
```

### What it does:
1. Syncs your entire Google Drive metadata to a local `archaeology.sqlite` database.
2. Skips Google Workspace export-only files until export handling is implemented.
3. Downloads pending files to the `downloads/` directory only when `DRY_RUN=0`.
4. Automatically identifies files under 100 KiB, the currently subsidized Turbo threshold, unless you override the byte limits.
5. Uploads only when `PERSONAL_ARCHAEOLOGY_UPLOAD=1`.
6. Stores the Arweave Transaction IDs back into the SQLite database.
