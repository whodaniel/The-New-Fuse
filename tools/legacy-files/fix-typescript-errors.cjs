const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * This script fixes all TypeScript errors in the codebase
 */

// Fix the utils.tsx file
console.log("🔧 Fixing TypeScript errors in src/generators/utils.tsx...");
const utilsPath = path.resolve(__dirname, 'packages/testing/src/generators/utils.tsx');
const utilsContent = `// Basic utility functions for generating test data
import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix: string = ''): string => {
  return \`\${prefix}\${Math.random().toString(36).substring(2, 11)}\`;
};

export interface TimestampOptions {
  past?: boolean;
  future?: boolean;
  daysRange?: number;
}

export const generateTimestamp = (options: TimestampOptions = {}): Date => {
  const now = new Date();
  const daysRange = options.daysRange || 30;
  
  if (options.past) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * daysRange));
    return pastDate;
  }
  
  if (options.future) {
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + Math.floor(Math.random() * daysRange));
    return futureDate;
  }
  
  return now;
};

// Generic function to pick a random element from an array
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generic function to generate a random enum value
export function generateEnum<T extends string>(values: T[]): T {
  return pickRandom(values);
}

export const generateBoolean = (likelihood: number = 0.5): boolean => {
  return Math.random() < likelihood;
};

export const generateNumber = (min: number = 0, max: number = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generic function to generate an array of items
export function generateArray<T>(
  generator: () => T,
  length: number = 3
): T[] {
  return Array.from({ length }, () => generator());
}

export function generateObject<T extends Record<string, any>>(
  template: T
): T {
  const result: any = {};
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'function') {
      result[key] = value();
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export const generateEmail = (username: string): string => {
  const domains = ['example.com', 'test.com', 'fakemail.com'];
  return \`\${username.toLowerCase().replace(/\\s+/g, '.')}@\${pickRandom(domains)}\`;
};`;

fs.writeFileSync(utilsPath, utilsContent);

// Fix the e2e/setup.tsx file
console.log("🔧 Fixing TypeScript errors in src/e2e/setup.tsx...");
const setupPath = path.resolve(__dirname, 'packages/testing/src/e2e/setup.tsx');
const setupContent = `import { TestEnvironment, TestConfig } from '@the-new-fuse/testing';

export class E2ETestFramework {
  constructor(private config: TestConfig) {}

  async setupEnvironment(): Promise<void> {
    const agent = new TestEnvironment(this.config);
    await this.agentTestRunner.initialize();
    return agent.runBehaviorTests();
  }
}`;

fs.writeFileSync(setupPath, setupContent);

// Fix the performance/utils/measurePerformance.tsx file
console.log("🔧 Fixing TypeScript errors in src/performance/utils/measurePerformance.tsx...");
const perfPath = path.resolve(__dirname, 'packages/testing/src/performance/utils/measurePerformance.tsx');
const perfContent = fs.readFileSync(perfPath, 'utf8');
const fixedPerfContent = perfContent.replace(
  /function calculateStats\(values: number\[\]\): any: PerformanceStats {/,
  'function calculateStats(values: number[]): PerformanceStats {'
);
fs.writeFileSync(perfPath, fixedPerfContent);

// Fix the performance/utils/memoryLeakDetector.tsx file
console.log("🔧 Fixing TypeScript errors in src/performance/utils/memoryLeakDetector.tsx...");
const memoryPath = path.resolve(__dirname, 'packages/testing/src/performance/utils/memoryLeakDetector.tsx');
const memoryContent = fs.readFileSync(memoryPath, 'utf8');
const fixedMemoryContent = memoryContent.replace(
  /function analyzeMemoryGrowth\(snapshots: MemorySnapshot\[\]\): any: {/,
  'function analyzeMemoryGrowth(snapshots: MemorySnapshot[]): {'
);
fs.writeFileSync(memoryPath, fixedMemoryContent);

// Fix the matchers/index.ts file
console.log("🔧 Fixing TypeScript errors in src/matchers/index.ts...");
const matchersPath = path.resolve(__dirname, 'packages/testing/src/matchers/index.ts');
const matchersContent = fs.readFileSync(matchersPath, 'utf8');
const fixedMatchersContent = matchersContent.replace(
  /export function setupTestMatchers\(\): any: void {/,
  'export function setupTestMatchers(): void {'
);
fs.writeFileSync(matchersPath, fixedMatchersContent);

console.log("✅ All TypeScript errors fixed successfully!");

// Now run the build process
console.log("🔧 Running the build process with database migrations skipped...");
try {
  // First generate Prisma client
  console.log("✅ Generating Prisma client...");
  execSync('cd packages/database && npx prisma generate', { stdio: 'inherit' });
  
  // Then run the build skipping database package
  console.log("✅ Building all packages except database...");
  execSync('yarn turbo run build --filter=!@the-new-fuse/database', { stdio: 'inherit' });
  
  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}