
export {}
exports.PostgresSQLConnector = void 0;
import pg_1 from 'pg';
class PostgresSQLConnector {
    constructor(config = { connectionString: null }) {
        this.connected = false;
        this.connectionString = config.connectionString || '';
        this._client = new pg_1.Client({
            connectionString: this.connectionString,
        });
        this.database_id = this.parseDatabase();
    }
    parseDatabase() {
        try {
            const url = new URL(this.connectionString);
            return url.pathname.slice(1); // Remove leading '/'
        }
        catch {
            return '';
        }
    }
    async connect(): Promise<void> {) {
        await this._client.connect();
        this.connected = true;
        return this._client;
    }
    async runQuery(): Promise<void> {queryString = '') {
        const result = { rows: [], count: 0, error: null };
        try {
            if (!this.connected)
                await this.connect();
            const query = await this._client.query(queryString);
            result.rows = query.rows;
            result.count = query.rowCount || 0;
        }
        catch (err) {
            
            result.error = err instanceof Error ? err.message : Unknown error occurred';
        }
        finally {
            await this._client.end();
            this.connected = false;
        }
        return result;
    }
    getTablesSql() {
        return `SELECT * FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    }
    getTableSchemaSql(table_name) {
        return `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length, 
        column_default, 
        is_nullable 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_name = '${table_name}'
    `;
    }
}
exports.PostgresSQLConnector = PostgresSQLConnector;
//# sourceMappingURL=Postgresql.js.mapexport {};
