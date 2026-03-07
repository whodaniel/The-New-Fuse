import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { FileSystemScanner } from '../scanner/FileSystemScanner';

describe('FileSystemScanner', () => {
  const testRootPath = path.join(__dirname, '../../../../'); // Go to project root
  const scanTimeoutMs = 60000;

  it('should scan file system and identify packages', { timeout: scanTimeoutMs }, async () => {
    const scanner = new FileSystemScanner(testRootPath);
    const result = await scanner.scanFileSystem();

    expect(result).toBeDefined();
    expect(result.rootPath).toBe(testRootPath);
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.packages).toBeDefined();
    expect(result.apps).toBeDefined();
    expect(result.scanTimestamp).toBeInstanceOf(Date);
  });

  it('should classify file types correctly', { timeout: scanTimeoutMs }, async () => {
    const scanner = new FileSystemScanner(testRootPath);
    const result = await scanner.scanFileSystem();

    // Find a TypeScript source file
    const allFiles = [
      ...result.rootFiles,
      ...result.packages.flatMap((p) => p.files),
      ...result.apps.flatMap((a) => a.files),
    ];

    const tsFiles = allFiles.filter((f) => f.extension === '.ts' && f.isSource);
    expect(tsFiles.length).toBeGreaterThan(0);

    const testFiles = allFiles.filter((f) => f.isTest);
    expect(testFiles.length).toBeGreaterThan(0);

    const configFiles = allFiles.filter((f) => f.isConfig);
    expect(configFiles.length).toBeGreaterThan(0);
  });

  it('should identify packages with package.json', { timeout: scanTimeoutMs }, async () => {
    const scanner = new FileSystemScanner(testRootPath);
    const result = await scanner.scanFileSystem();

    const packagesWithJson = result.packages.filter((p) => p.packageJson !== null);
    expect(packagesWithJson.length).toBeGreaterThan(0);

    // Check that package.json data is parsed correctly
    const firstPackage = packagesWithJson[0];
    expect(firstPackage.packageJson).toBeDefined();
    expect(firstPackage.packageJson.name).toBeDefined();
  });
});
