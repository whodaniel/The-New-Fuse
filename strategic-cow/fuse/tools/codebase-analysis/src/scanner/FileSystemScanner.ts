import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  type: FileType;
  size: number;
  lastModified: Date;
  packagePath?: string;
  isSource: boolean;
  isTest: boolean;
  isConfig: boolean;
  isDocumentation: boolean;
}

export interface PackageInfo {
  name: string;
  path: string;
  type: PackageType;
  packageJson?: any;
  files: FileInfo[];
  sourceFiles: FileInfo[];
  testFiles: FileInfo[];
  configFiles: FileInfo[];
  documentationFiles: FileInfo[];
}

export interface FileSystemMap {
  rootPath: string;
  totalFiles: number;
  packages: PackageInfo[];
  apps: PackageInfo[];
  rootFiles: FileInfo[];
  scanTimestamp: Date;
}

export enum FileType {
  SOURCE = 'source',
  TEST = 'test',
  CONFIG = 'config',
  DOCUMENTATION = 'documentation',
  BUILD = 'build',
  ASSET = 'asset',
  OTHER = 'other'
}

export enum PackageType {
  APP = 'app',
  PACKAGE = 'package',
  TOOL = 'tool',
  LIBRARY = 'library'
}

export class FileSystemScanner {
  private rootPath: string;
  private excludePatterns: string[];

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
    this.excludePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'out/**',
      '.next/**',
      'coverage/**',
      '*.log',
      '.DS_Store'
    ];
  }

  async scanFileSystem(): Promise<FileSystemMap> {
    console.log(`Starting file system scan from: ${this.rootPath}`);
    
    const packages = await this.scanPackages();
    const apps = await this.scanApps();
    const rootFiles = await this.scanRootFiles();
    
    const totalFiles = packages.reduce((sum, pkg) => sum + pkg.files.length, 0) +
                      apps.reduce((sum, app) => sum + app.files.length, 0) +
                      rootFiles.length;

    return {
      rootPath: this.rootPath,
      totalFiles,
      packages,
      apps,
      rootFiles,
      scanTimestamp: new Date()
    };
  }

  private async scanPackages(): Promise<PackageInfo[]> {
    const packagesDir = path.join(this.rootPath, 'packages');
    
    try {
      await fs.access(packagesDir);
    } catch {
      console.log('No packages directory found');
      return [];
    }

    const packageDirs = await this.getDirectories(packagesDir);
    const packages: PackageInfo[] = [];

    for (const dir of packageDirs) {
      const packagePath = path.join(packagesDir, dir);
      const packageInfo = await this.analyzePackage(packagePath, PackageType.PACKAGE);
      packages.push(packageInfo);
    }

    return packages;
  }

  private async scanApps(): Promise<PackageInfo[]> {
    const appsDir = path.join(this.rootPath, 'apps');
    
    try {
      await fs.access(appsDir);
    } catch {
      console.log('No apps directory found');
      return [];
    }

    const appDirs = await this.getDirectories(appsDir);
    const apps: PackageInfo[] = [];

    for (const dir of appDirs) {
      const appPath = path.join(appsDir, dir);
      const appInfo = await this.analyzePackage(appPath, PackageType.APP);
      apps.push(appInfo);
    }

    return apps;
  }

  private async scanRootFiles(): Promise<FileInfo[]> {
    const files = await glob('*', {
      cwd: this.rootPath,
      ignore: this.excludePatterns,
      nodir: true
    });

    const fileInfos: FileInfo[] = [];
    
    for (const file of files) {
      const filePath = path.join(this.rootPath, file);
      const fileInfo = await this.analyzeFile(filePath);
      fileInfos.push(fileInfo);
    }

    return fileInfos;
  }

  private async analyzePackage(packagePath: string, type: PackageType): Promise<PackageInfo> {
    const packageName = path.basename(packagePath);
    let packageJson: any = null;

    // Try to read package.json
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
    } catch {
      console.log(`No package.json found for ${packageName}`);
    }

    // Scan all files in the package
    const files = await this.scanPackageFiles(packagePath);
    
    // Categorize files
    const sourceFiles = files.filter(f => f.isSource);
    const testFiles = files.filter(f => f.isTest);
    const configFiles = files.filter(f => f.isConfig);
    const documentationFiles = files.filter(f => f.isDocumentation);

    return {
      name: packageJson?.name || packageName,
      path: packagePath,
      type,
      packageJson,
      files,
      sourceFiles,
      testFiles,
      configFiles,
      documentationFiles
    };
  }

  private async scanPackageFiles(packagePath: string): Promise<FileInfo[]> {
    const files = await glob('**/*', {
      cwd: packagePath,
      ignore: this.excludePatterns,
      nodir: true
    });

    const fileInfos: FileInfo[] = [];
    
    for (const file of files) {
      const filePath = path.join(packagePath, file);
      const fileInfo = await this.analyzeFile(filePath, packagePath);
      fileInfos.push(fileInfo);
    }

    return fileInfos;
  }

  private async analyzeFile(filePath: string, packagePath?: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const extension = path.extname(fileName);
    
    const fileInfo: FileInfo = {
      path: filePath,
      name: fileName,
      extension,
      type: this.classifyFileType(fileName, filePath),
      size: stats.size,
      lastModified: stats.mtime,
      packagePath,
      isSource: this.isSourceFile(fileName, filePath),
      isTest: this.isTestFile(fileName, filePath),
      isConfig: this.isConfigFile(fileName, filePath),
      isDocumentation: this.isDocumentationFile(fileName, filePath)
    };

    return fileInfo;
  }

  private classifyFileType(fileName: string, filePath: string): FileType {
    if (this.isTestFile(fileName, filePath)) return FileType.TEST;
    if (this.isConfigFile(fileName, filePath)) return FileType.CONFIG;
    if (this.isDocumentationFile(fileName, filePath)) return FileType.DOCUMENTATION;
    if (this.isSourceFile(fileName, filePath)) return FileType.SOURCE;
    if (this.isBuildFile(fileName, filePath)) return FileType.BUILD;
    if (this.isAssetFile(fileName, filePath)) return FileType.ASSET;
    return FileType.OTHER;
  }

  private isSourceFile(fileName: string, filePath: string): boolean {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
    const extension = path.extname(fileName);
    
    if (!sourceExtensions.includes(extension)) return false;
    if (this.isTestFile(fileName, filePath)) return false;
    if (this.isConfigFile(fileName, filePath)) return false;
    
    return true;
  }

  private isTestFile(fileName: string, filePath: string): boolean {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      /\.e2e\./,
      /\.integration\./
    ];
    
    return testPatterns.some(pattern => pattern.test(fileName) || pattern.test(filePath));
  }

  private isConfigFile(fileName: string, filePath: string): boolean {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'jest.config.js',
      'jest.config.ts',
      'vitest.config.ts',
      'vite.config.ts',
      'webpack.config.js',
      'rollup.config.js',
      'babel.config.js',
      '.eslintrc.json',
      '.eslintrc.js',
      'eslint.config.js',
      '.prettierrc',
      'turbo.json',
      'docker-compose.yml',
      'Dockerfile'
    ];
    
    const configPatterns = [
      /\.config\./,
      /\.conf\./,
      /^\.env/,
      /\.yml$/,
      /\.yaml$/,
      /\.json$/
    ];
    
    return configFiles.includes(fileName) || 
           configPatterns.some(pattern => pattern.test(fileName));
  }

  private isDocumentationFile(fileName: string, filePath: string): boolean {
    const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
    const extension = path.extname(fileName);
    
    return docExtensions.includes(extension) || 
           fileName.toLowerCase().includes('readme') ||
           fileName.toLowerCase().includes('changelog') ||
           filePath.includes('/docs/');
  }

  private isBuildFile(fileName: string, filePath: string): boolean {
    const buildPatterns = [
      /\.sh$/,
      /\.bat$/,
      /\.ps1$/,
      /Makefile$/,
      /\.mk$/
    ];
    
    return buildPatterns.some(pattern => pattern.test(fileName)) ||
           filePath.includes('/scripts/') ||
           filePath.includes('/build/');
  }

  private isAssetFile(fileName: string, filePath: string): boolean {
    const assetExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
      '.css', '.scss', '.sass', '.less',
      '.woff', '.woff2', '.ttf', '.eot',
      '.mp3', '.mp4', '.avi', '.mov'
    ];
    
    const extension = path.extname(fileName);
    return assetExtensions.includes(extension);
  }

  private async getDirectories(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  }
}