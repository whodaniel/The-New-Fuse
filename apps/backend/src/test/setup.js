"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestModule = setupTestModule;
exports.setupTestDatabase = setupTestDatabase;
exports.teardownTestDatabase = teardownTestDatabase;
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
async function setupTestModule() {
    const moduleRef = await testing_1.Test.createTestingModule({
        providers: [
            prisma_service_1.PrismaService,
            {
                provide: config_1.ConfigService,
                useValue: {
                    get: jest.fn((key) => {
                        const config = {
                            DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                            REDIS_HOST: 'localhost',
                            REDIS_PORT: 6379,
                        };
                        return config[key];
                    }),
                },
            },
        ],
    }).compile();
    return moduleRef;
}
async function setupTestDatabase() {
    const prisma = new prisma_service_1.PrismaService();
    // Clean up test database
    await prisma.$executeRaw `TRUNCATE TABLE "User" CASCADE`;
    await prisma.$executeRaw `TRUNCATE TABLE "Agent" CASCADE`;
    return prisma;
}
async function teardownTestDatabase(prisma) {
    await prisma.$disconnect();
}
//# sourceMappingURL=setup.js.map