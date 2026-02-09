"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToZodSchema = exports.zodSchemaToJson = exports.safeJsonParse = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
// Singleton pattern for Prisma client
class PrismaClientSingleton {
    static instance;
    static getInstance() {
        if (!PrismaClientSingleton.instance) {
            PrismaClientSingleton.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['query', 'error', 'warn']
                    : ['error'],
            });
            // Optional: Extensions or middleware could be added here
            PrismaClientSingleton.instance.$use(async (params, next) => {
                const before = Date.now();
                const result = await next(params);
                const after = Date.now();
                logger_1.logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
                return result;
            });
        }
        return PrismaClientSingleton.instance;
    }
}
// Export the prisma client
exports.prisma = PrismaClientSingleton.getInstance();
// Handle graceful shutdown
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
// Helper function to safely serialize/deserialize JSON
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
// Helper to convert Zod schemas to/from JSON
const zodSchemaToJson = (schema) => {
    return JSON.stringify(schema);
};
exports.zodSchemaToJson = zodSchemaToJson;
const jsonToZodSchema = (json) => {
    return (0, exports.safeJsonParse)(json, {});
};
exports.jsonToZodSchema = jsonToZodSchema;
// Export default client
exports.default = exports.prisma;
//# sourceMappingURL=prisma-client.js.map