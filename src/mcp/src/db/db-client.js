"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToZodSchema = exports.zodSchemaToJson = exports.safeJsonParse = exports.db = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
const now = () => new Date();
function matchesWhere(item, where) {
    if (!where)
        return true;
    return Object.entries(where).every(([key, value]) => item[key] === value);
}
function applyOrder(items, orderBy) {
    if (!orderBy)
        return items;
    const [[key, direction]] = Object.entries(orderBy);
    return items.slice().sort((a, b) => {
        if (a[key] === b[key])
            return 0;
        if (direction === 'asc')
            return a[key] > b[key] ? 1 : -1;
        return a[key] < b[key] ? 1 : -1;
    });
}
function createModel(name) {
    const items = new Map();
    const getId = (data) => data.id ?? (0, uuid_1.v4)();
    return {
        data: items,
        async create(opts) {
            const id = getId(opts.data);
            const record = {
                ...opts.data,
                id,
                createdAt: opts.data.createdAt ?? now(),
                updatedAt: opts.data.updatedAt ?? now(),
            };
            items.set(id, record);
            return record;
        },
        async findUnique(opts) {
            for (const item of items.values()) {
                if (matchesWhere(item, opts.where))
                    return item;
            }
            return null;
        },
        async findFirst(opts) {
            return this.findUnique(opts);
        },
        async findMany(opts = {}) {
            let results = Array.from(items.values()).filter((item) => matchesWhere(item, opts.where));
            results = applyOrder(results, opts.orderBy);
            if (opts.take !== undefined)
                return results.slice(0, opts.take);
            return results;
        },
        async update(opts) {
            const existing = await this.findUnique({ where: opts.where });
            if (!existing)
                throw new Error(`${name} not found`);
            const updated = { ...existing, ...opts.data, updatedAt: now() };
            items.set(updated.id, updated);
            return updated;
        },
        async delete(opts) {
            const existing = await this.findUnique({ where: opts.where });
            if (!existing)
                throw new Error(`${name} not found`);
            items.delete(existing.id);
            return existing;
        },
        async deleteMany(opts) {
            const toDelete = Array.from(items.values()).filter((item) => matchesWhere(item, opts.where));
            toDelete.forEach((item) => items.delete(item.id));
            return { count: toDelete.length };
        },
        async count(opts = {}) {
            return Array.from(items.values()).filter((item) => matchesWhere(item, opts.where)).length;
        },
    };
}
exports.db = {
    agent: createModel('agent'),
    agentState: createModel('agentState'),
    tool: createModel('tool'),
    toolCall: createModel('toolCall'),
    toolExecution: createModel('toolExecution'),
    conversation: createModel('conversation'),
    conversationAgent: createModel('conversationAgent'),
    message: createModel('message'),
    workflow: createModel('workflow'),
    workflowExecution: createModel('workflowExecution'),
    workflowStepExecution: createModel('workflowStepExecution'),
};
process.on('beforeExit', async () => {
    logger_1.logger.info('MCP db client shutdown complete');
});
const safeJsonParse = (json, fallback) => {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        logger_1.logger.error(`Error parsing JSON: ${e.message}`);
        return fallback;
    }
};
exports.safeJsonParse = safeJsonParse;
const zodSchemaToJson = (schema) => {
    return JSON.stringify(schema);
};
exports.zodSchemaToJson = zodSchemaToJson;
const jsonToZodSchema = (json) => {
    return (0, exports.safeJsonParse)(json, {});
};
exports.jsonToZodSchema = jsonToZodSchema;
exports.default = exports.db;
