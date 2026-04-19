import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class DatabaseService {
    constructor(dbPath) {
        this.dbPath = dbPath || path.join(os.homedir(), '.local', 'share', 'tnf', 'data.json');
        this.dataPath = path.dirname(this.dbPath);
        this.data = {};
        this.loadData();
    }
    loadData() {
        if (fs.existsSync(this.dbPath)) {
            try {
                const content = fs.readFileSync(this.dbPath, 'utf8');
                this.data = JSON.parse(content);
            }
            catch {
                this.data = {};
            }
        }
    }
    saveData() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    }
    getPath() {
        return this.dbPath;
    }
    async openInteractive() {
        console.log(`TNF Database: ${this.dbPath}`);
        console.log('This is a JSON-based database. Use "tnf db query" to query data.');
        console.log('Tables (keys) available:');
        for (const key of Object.keys(this.data)) {
            console.log(`  - ${key} (${this.data[key]?.length || 0} records)`);
        }
    }
    async query(sql, options = {}) {
        const tableMatch = sql.match(/(?:FROM|from)\s+(\w+)/);
        const tableName = tableMatch ? tableMatch[1] : null;
        if (!tableName) {
            return { columns: ['result'], rows: [{ result: 'No table specified' }] };
        }
        const tableData = this.data[tableName] || [];
        const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
        let rows = tableData;
        const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*['"]?([^'"\s]+)['"]?/i);
        if (whereMatch) {
            const [, col, val] = whereMatch;
            rows = rows.filter(r => String(r[col]) === val);
        }
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
            rows = rows.slice(0, parseInt(limitMatch[1], 10));
        }
        return { columns, rows };
    }
    async migrate() {
        const errors = [];
        let migrated = 0;
        const jsonPaths = [
            path.join(os.homedir(), '.config', 'tnf', 'sessions.json'),
            path.join(os.homedir(), '.config', 'tnf', 'stats.json'),
            path.join(os.homedir(), '.local', 'share', 'tnf', 'sessions.json'),
            path.join(os.homedir(), '.local', 'share', 'tnf', 'stats.json'),
        ];
        for (const jsonPath of jsonPaths) {
            if (fs.existsSync(jsonPath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    const tableName = path.basename(jsonPath, '.json');
                    const records = Array.isArray(data) ? data : [data];
                    this.data[tableName] = records;
                    migrated++;
                }
                catch (e) {
                    errors.push(`Failed to migrate ${jsonPath}: ${e.message}`);
                }
            }
        }
        if (migrated > 0) {
            this.saveData();
        }
        return { migrated, errors };
    }
    getTable(name) {
        return this.data[name] || [];
    }
    setTable(name, data) {
        this.data[name] = data;
        this.saveData();
    }
    insert(name, record) {
        if (!this.data[name]) {
            this.data[name] = [];
        }
        this.data[name].push(record);
        this.saveData();
    }
}
//# sourceMappingURL=DatabaseService.js.map