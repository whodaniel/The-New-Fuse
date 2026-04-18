import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as sqlite3 from 'sqlite3';

export interface DatabaseOptions {
  format?: 'json' | 'tsv';
}

export class DatabaseService {
  private dbPath: string;
  private db: sqlite3.Database | null = null;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(os.homedir(), '.local', 'share', 'tnf', 'data.db');
  }

  getPath(): string {
    return this.dbPath;
  }

  async init(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async openInteractive(): Promise<void> {
    console.log(`SQLite database: ${this.dbPath}`);
    console.log('Use .tables to list tables, .schema <table> to show schema, .quit to exit');
  }

  async query(sql: string, options: DatabaseOptions = {}): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      this.db!.all(sql, [], (err, rows: Record<string, unknown>[]) => {
        if (err) reject(err);
        else {
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
          resolve({ columns, rows });
        }
      });
    });
  }

  async migrate(): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    const jsonPaths = [
      path.join(os.homedir(), '.config', 'tnf', 'sessions.json'),
      path.join(os.homedir(), '.config', 'tnf', 'stats.json'),
      path.join(os.homedir(), '.local', 'share', 'tnf', 'sessions.json'),
      path.join(os.homedir(), '.local', 'share', 'tnf', 'stats.json'),
    ];

    if (!this.db) await this.init();

    for (const jsonPath of jsonPaths) {
      if (fs.existsSync(jsonPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const tableName = path.basename(jsonPath, '.json');

          await this.createTableFromData(tableName, Array.isArray(data) ? data[0] : data);
          await this.insertData(tableName, Array.isArray(data) ? data : [data]);
          migrated++;
        } catch (e) {
          errors.push(`Failed to migrate ${jsonPath}: ${(e as Error).message}`);
        }
      }
    }

    return { migrated, errors };
  }

  private async createTableFromData(tableName: string, sampleData: Record<string, unknown>): Promise<void> {
    const columns: string[] = [];
    for (const [key, value] of Object.entries(sampleData)) {
      const type = this.inferSqliteType(value);
      columns.push(`${key} ${type}`);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`;
    return new Promise((resolve, reject) => {
      this.db!.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private inferSqliteType(value: unknown): string {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    }
    if (typeof value === 'boolean') return 'INTEGER';
    return 'TEXT';
  }

  private async insertData(tableName: string, data: Record<string, unknown>[]): Promise<void> {
    for (const row of data) {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => {
        const v = row[k];
        return typeof v === 'object' ? JSON.stringify(v) : v;
      });

      const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      await new Promise<void>((resolve, reject) => {
        this.db!.run(sql, values, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }
}
