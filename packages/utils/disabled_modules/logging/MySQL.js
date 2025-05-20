"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLConnector = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const url_pattern_1 = __importDefault(require("url-pattern"));
class MySQLConnector {
    constructor(config = { connectionString: null }) {
        this.connected = false;
        this._client = null;
        this.connectionString = config.connectionString || '';
        this.database_id = this.parseDatabase();
    }
    parseDatabase() {
        const connectionPattern = new url_pattern_1.default('mysql\\://*@*/:database*');
        const match = connectionPattern.match(this.connectionString);
        return match?.database || '';
    }
}
() => ;
() => {
    this._client = await promise_1.default.createConnection({ uri: this.connectionString });
    this.connected = true;
    return this._client;
};
async;
runQuery();
Promise();
Promise(queryString = '');
{
    const result = { rows: [], count: 0, error: null };
    try {
        if (!this.connected)
            await this.connect();
        if (!this._client)
            throw new Error('Client not initialized');
        const [query] = await this._client.query(queryString);
        result.rows = query;
        result.count = query?.length || 0;
    }
    catch (err) {
        
        result.error = err instanceof Error ? err.message : 'Unknown error occurred';
    }
    finally {
        await this._client?.end();
        this.connected = false;
    }
    return result;
}
getTablesSql();
{
    return `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;
}
exports.MySQLConnector = MySQLConnector;
export {};
//# sourceMappingURL=MySQL.js.map