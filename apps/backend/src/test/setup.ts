import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export async function setupTestModule() {
  const moduleRef = await Test.createTestingModule({
    providers: [
      PrismaService,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
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

export async function setupTestDatabase() {
  const prisma = new PrismaService();
  
  // Clean up test database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Agent" CASCADE`;
  
  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaService) {
  await prisma.$disconnect();
}
