"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemScanner = exports.PackageType = exports.FileType = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
var FileType;
(function (FileType) {
    FileType["SOURCE"] = "source";
    FileType["TEST"] = "test";
    FileType["CONFIG"] = "config";
    FileType["DOCUMENTATION"] = "documentation";
    FileType["BUILD"] = "build";
    FileType["ASSET"] = "asset";
    FileType["OTHER"] = "other";
})(FileType || (exports.FileType = FileType = {}));
var PackageType;
(function (PackageType) {
    PackageType["APP"] = "app";
    PackageType["PACKAGE"] = "package";
    PackageType["TOOL"] = "tool";
    PackageType["LIBRARY"] = "library";
})(PackageType || (exports.PackageType = PackageType = {}));
class FileSystemScanner {
    constructor(rootPath = process.cwd()) {
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
    async scanFileSystem() {
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
    async scanPackages() {
        const packagesDir = path.join(this.rootPath, 'packages');
        try {
            await fs.access(packagesDir);
        }
        catch {
            console.log('No packages directory found');
            return [];
        }
        const packageDirs = await this.getDirectories(packagesDir);
        const packages = [];
        for (const dir of packageDirs) {
            const packagePath = path.join(packagesDir, dir);
            const packageInfo = await this.analyzePackage(packagePath, PackageType.PACKAGE);
            packages.push(packageInfo);
        }
        return packages;
    }
    async scanApps() {
        const appsDir = path.join(this.rootPath, 'apps');
        try {
            await fs.access(appsDir);
        }
        catch {
            console.log('No apps directory found');
            return [];
        }
        const appDirs = await this.getDirectories(appsDir);
        const apps = [];
        for (const dir of appDirs) {
            const appPath = path.join(appsDir, dir);
            const appInfo = await this.analyzePackage(appPath, PackageType.APP);
            apps.push(appInfo);
        }
        return apps;
    }
    async scanRootFiles() {
        const files = await (0, glob_1.glob)('*', {
            cwd: this.rootPath,
            ignore: this.excludePatterns,
            nodir: true
        });
        const fileInfos = [];
        for (const file of files) {
            const filePath = path.join(this.rootPath, file);
            const fileInfo = await this.analyzeFile(filePath);
            fileInfos.push(fileInfo);
        }
        return fileInfos;
    }
    async analyzePackage(packagePath, type) {
        const packageName = path.basename(packagePath);
        let packageJson = null;
        // Try to read package.json
        try {
            const packageJsonPath = path.join(packagePath, 'package.json');
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            packageJson = JSON.parse(packageJsonContent);
        }
        catch {
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
    async scanPackageFiles(packagePath) {
        const files = await (0, glob_1.glob)('**/*', {
            cwd: packagePath,
            ignore: this.excludePatterns,
            nodir: true
        });
        const fileInfos = [];
        for (const file of files) {
            const filePath = path.join(packagePath, file);
            const fileInfo = await this.analyzeFile(filePath, packagePath);
            fileInfos.push(fileInfo);
        }
        return fileInfos;
    }
    async analyzeFile(filePath, packagePath) {
        const stats = await fs.stat(filePath);
        const fileName = path.basename(filePath);
        const extension = path.extname(fileName);
        const fileInfo = {
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
    classifyFileType(fileName, filePath) {
        if (this.isTestFile(fileName, filePath))
            return FileType.TEST;
        if (this.isConfigFile(fileName, filePath))
            return FileType.CONFIG;
        if (this.isDocumentationFile(fileName, filePath))
            return FileType.DOCUMENTATION;
        if (this.isSourceFile(fileName, filePath))
            return FileType.SOURCE;
        if (this.isBuildFile(fileName, filePath))
            return FileType.BUILD;
        if (this.isAssetFile(fileName, filePath))
            return FileType.ASSET;
        return FileType.OTHER;
    }
    isSourceFile(fileName, filePath) {
        const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
        const extension = path.extname(fileName);
        if (!sourceExtensions.includes(extension))
            return false;
        if (this.isTestFile(fileName, filePath))
            return false;
        if (this.isConfigFile(fileName, filePath))
            return false;
        return true;
    }
    isTestFile(fileName, filePath) {
        const testPatterns = [
            /\.test\./,
            /\.spec\./,
            /__tests__/,
            /\.e2e\./,
            /\.integration\./
        ];
        return testPatterns.some(pattern => pattern.test(fileName) || pattern.test(filePath));
    }
    isConfigFile(fileName, filePath) {
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
    isDocumentationFile(fileName, filePath) {
        const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
        const extension = path.extname(fileName);
        return docExtensions.includes(extension) ||
            fileName.toLowerCase().includes('readme') ||
            fileName.toLowerCase().includes('changelog') ||
            filePath.includes('/docs/');
    }
    isBuildFile(fileName, filePath) {
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
    isAssetFile(fileName, filePath) {
        const assetExtensions = [
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.css', '.scss', '.sass', '.less',
            '.woff', '.woff2', '.ttf', '.eot',
            '.mp3', '.mp4', '.avi', '.mov'
        ];
        const extension = path.extname(fileName);
        return assetExtensions.includes(extension);
    }
    async getDirectories(dirPath) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    }
}
exports.FileSystemScanner = FileSystemScanner;
//# sourceMappingURL=FileSystemScanner.js.map