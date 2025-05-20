export {}
exports.WorkflowStorage = void 0;
import sqlite3_1 from 'sqlite3';
import util_1 from 'util';
import schema_1 from './schema.js';
class WorkflowStorage {
    constructor(dbPath) {
        this.initialized = false;
        this.db = new sqlite3_1.Database(dbPath);
    }
    async initialize(): Promise<void> {
        if (this.initialized)
            return;
        const run = (0, util_1.promisify)(this.db.run.bind(this.db));
        const statements = schema_1.SCHEMA_SQL.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
            await run(statement);
        }
        this.initialized = true;
    }
    // Workflow CRUD operations
    async createWorkflow(metadata: any, data: any): Promise<string> {
        const run = (0, util_1.promisify)(this.db.run.bind(this.db));
        await run(`INSERT INTO workflows (id, name, description, version, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            metadata.id,
            metadata.name,
            metadata.description,
            metadata.version,
            JSON.stringify(data),
            metadata.createdAt.toISOString(),
            metadata.updatedAt.toISOString(),
        ]);
        return metadata.id;
    }
    async getWorkflow(id: string): Promise<any> {
        const get = (0, util_1.promisify)(this.db.get.bind(this.db));
        const row = await get('SELECT * FROM workflows WHERE id = ?', [id]);
        if (!row)
            return null;
        return {
            metadata: {
                id: row.id,
                name: row.name,
                description: row.description,
                version: row.version,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            },
            data: JSON.parse(row.data),
        };
    }
    async updateWorkflow(id: string, metadata: any, data: any): Promise<void> {
        const run = (0, util_1.promisify)(this.db.run.bind(this.db));
        const updates = [];
        const params = [];
        if (metadata.name) {
            updates.push('name = ?');
            params.push(metadata.name);
        }
        if (metadata.description !== undefined) {
            updates.push('description = ?');
            params.push(metadata.description);
        }
        if (metadata.version) {
            updates.push('version = ?');
            params.push(metadata.version);
        }
        if (data) {
            updates.push('data = ?');
            params.push(JSON.stringify(data));
        }
        updates.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(id);
        await run(`UPDATE workflows SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    async deleteWorkflow(id: string): Promise<void> {
        const run = (0, util_1.promisify)(this.db.run.bind(this.db));
        await run('DELETE FROM workflows WHERE id = ?', [id]);
    }
    // Workflow run operations
    async createRun(run: any): Promise<string> {
        const dbRun = (0, util_1.promisify)(this.db.run.bind(this.db));
        await dbRun(`INSERT INTO workflow_runs (
        id, workflow_id, status, start_time, end_time,
        node_statuses, node_outputs, errors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            run.id,
            run.workflowId,
            run.status,
            run.startTime.toISOString(),
            run.endTime?.toISOString(),
            JSON.stringify(run.nodeStatuses),
            JSON.stringify(run.nodeOutputs),
            JSON.stringify(run.errors),
        ]);
        return run.id;
    }
    async updateRun(id: string, updates: any): Promise<void> {
        const run = (0, util_1.promisify)(this.db.run.bind(this.db));
        const setStatements = [];
        const params = [];
        if (updates.status) {
            setStatements.push('status = ?');
            params.push(updates.status);
        }
        if (updates.endTime) {
            setStatements.push('end_time = ?');
            params.push(updates.endTime.toISOString());
        }
        if (updates.nodeStatuses) {
            setStatements.push('node_statuses = ?');
            params.push(JSON.stringify(updates.nodeStatuses));
        }
        if (updates.nodeOutputs) {
            setStatements.push('node_outputs = ?');
            params.push(JSON.stringify(updates.nodeOutputs));
        }
        if (updates.errors) {
            setStatements.push('errors = ?');
            params.push(JSON.stringify(updates.errors));
        }
        params.push(id);
        await run(`UPDATE workflow_runs SET ${setStatements.join(', ')} WHERE id = ?`, params);
    }
    async getRun(id: string): Promise<any> {
        const get = (0, util_1.promisify)(this.db.get.bind(this.db));
        const row = await get('SELECT * FROM workflow_runs WHERE id = ?', [id]);
        if (!row)
            return null;
        return {
            id: row.id,
            workflowId: row.workflow_id,
            status: row.status,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : undefined,
            nodeStatuses: JSON.parse(row.node_statuses),
            nodeOutputs: JSON.parse(row.node_outputs),
            errors: JSON.parse(row.errors),
        };
    }
    async getWorkflowRuns(workflowId: string): Promise<any[]> {
        const all = (0, util_1.promisify)(this.db.all.bind(this.db));
        const rows = await all('SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY start_time DESC', [workflowId]);
        return rows.map(row => ({
            id: row.id,
            workflowId: row.workflow_id,
            status: row.status,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : undefined,
            nodeStatuses: JSON.parse(row.node_statuses),
            nodeOutputs: JSON.parse(row.node_outputs),
            errors: JSON.parse(row.errors),
        }));
    }
    // Variable operations
    async setVariable(workflowId: string, name: string, value: any): Promise<void> {
        const run = (0, util_1.promisify)(this.db.run.bind(this.db));
        await run(`INSERT OR REPLACE INTO workflow_variables (workflow_id, name, value, created_at)
       VALUES (?, ?, ?, ?)`, [workflowId, name, value, new Date().toISOString()]);
    }
    async getVariable(workflowId: string, name: string): Promise<any> {
        const get = (0, util_1.promisify)(this.db.get.bind(this.db));
        const row = await get('SELECT value FROM workflow_variables WHERE workflow_id = ? AND name = ?', [workflowId, name]);
        return row ? row.value : null;
    }
    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close(err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
exports.WorkflowStorage = WorkflowStorage;
//# sourceMappingURL=storage.js.mapexport {};
