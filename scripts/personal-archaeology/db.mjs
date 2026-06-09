import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'archaeology.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  }
});

export function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          name TEXT,
          mime_type TEXT,
          size INTEGER,
          md5_checksum TEXT,
          download_status TEXT DEFAULT 'pending',
          local_path TEXT,
          arweave_txid TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id TEXT,
          metadata_type TEXT,
          content TEXT,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(file_id) REFERENCES files(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export function insertFile(file) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO files (id, name, mime_type, size, md5_checksum)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(file.id, file.name, file.mimeType, file.size, file.md5Checksum, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
    stmt.finalize();
  });
}

export function getPendingDownloads(maxDownloadSize) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM files WHERE download_status = 'pending' AND size > 0 AND size <= ? ORDER BY created_at ASC`,
      [maxDownloadSize],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

export function getPendingDownloadCount() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM files WHERE download_status = 'pending'`, (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
}

export function markSkipped(fileId, reason) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE files SET download_status = ? WHERE id = ?`,
      [`skipped:${reason}`, fileId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function markDownloadFailed(fileId, reason) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE files SET download_status = ? WHERE id = ?`,
      [`failed:${reason.slice(0, 160)}`, fileId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function getUploadableFiles(maxUploadSize) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM files
       WHERE download_status = 'completed'
         AND arweave_txid IS NULL
         AND size > 0
         AND size <= ?
       ORDER BY created_at ASC`,
      [maxUploadSize],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

export function getUploadableCount(maxUploadSize) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS count FROM files
       WHERE download_status = 'completed'
         AND arweave_txid IS NULL
         AND size > 0
         AND size <= ?`,
      [maxUploadSize],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

export function getOversizeUploadCount(maxUploadSize) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS count FROM files
       WHERE download_status = 'completed'
         AND arweave_txid IS NULL
         AND size > ?`,
      [maxUploadSize],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

export function getDownloadCandidateCount(maxDownloadSize) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS count FROM files
       WHERE download_status = 'pending'
         AND size > 0
         AND size <= ?`,
      [maxDownloadSize],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

export function getOversizeDownloadCount(maxDownloadSize) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS count FROM files
       WHERE download_status = 'pending'
         AND size > ?`,
      [maxDownloadSize],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

export function getZeroSizePendingCount() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS count FROM files
       WHERE download_status = 'pending'
         AND size <= 0`,
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

export function closeDb() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function markDownloaded(fileId, localPath) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE files SET download_status = 'completed', local_path = ? WHERE id = ?`,
      [localPath, fileId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function updateArweaveTxid(fileId, txid) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE files SET arweave_txid = ? WHERE id = ?`,
      [txid, fileId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
