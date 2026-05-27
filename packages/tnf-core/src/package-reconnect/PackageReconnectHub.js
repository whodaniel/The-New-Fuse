import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
function normalizePath(value) {
    return value.replace(/\\/g, '/');
}
function detectRepoRoot(startDir) {
    let current = path.resolve(startDir);
    while (true) {
        const packageJsonPath = path.join(current, 'package.json');
        const packagesDir = path.join(current, 'packages');
        if (fs.existsSync(packageJsonPath) && fs.existsSync(packagesDir)) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            throw new Error(`Could not find TNF repo root from ${startDir}`);
        }
        current = parent;
    }
}
function readPackageJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function isInternalScopedName(name) {
    return name.startsWith('@the-new-fuse/') || name.startsWith('@tnf/');
}
export class PackageReconnectHub {
    constructor(repoRoot) {
        const fileDir = path.dirname(fileURLToPath(import.meta.url));
        this.repoRoot = repoRoot ? path.resolve(repoRoot) : detectRepoRoot(fileDir);
        const rootPackageJson = path.join(this.repoRoot, 'package.json');
        this.rootRequire = createRequire(pathToFileURL(rootPackageJson).href);
    }
    getRepoRoot() {
        return this.repoRoot;
    }
    listPackages() {
        const packagesRoot = path.join(this.repoRoot, 'packages');
        if (!fs.existsSync(packagesRoot))
            return [];
        return fs
            .readdirSync(packagesRoot)
            .map((entry) => path.join(packagesRoot, entry))
            .filter((entryPath) => fs.statSync(entryPath).isDirectory())
            .map((dirPath) => ({
            dirPath,
            packageJsonPath: path.join(dirPath, 'package.json'),
        }))
            .filter((entry) => fs.existsSync(entry.packageJsonPath))
            .map((entry) => {
            const pkg = readPackageJson(entry.packageJsonPath);
            const name = pkg.name || path.basename(entry.dirPath);
            return {
                name,
                version: pkg.version || '0.0.0',
                private: pkg.private === true,
                directory: normalizePath(path.relative(this.repoRoot, entry.dirPath)),
                packageJsonPath: normalizePath(path.relative(this.repoRoot, entry.packageJsonPath)),
                main: pkg.main,
                types: pkg.types,
                exports: pkg.exports,
                scripts: pkg.scripts || {},
            };
        })
            .filter((pkg) => isInternalScopedName(pkg.name))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    findPackage(packageName) {
        return this.listPackages().find((pkg) => pkg.name === packageName);
    }
    async probePackage(packageName, options = {}) {
        const manifest = this.findPackage(packageName);
        if (!manifest) {
            throw new Error(`Package not found in monorepo: ${packageName}`);
        }
        const hasMainField = typeof manifest.main === 'string' && manifest.main.length > 0;
        const hasTypesField = typeof manifest.types === 'string' && manifest.types.length > 0;
        const hasExportsField = typeof manifest.exports !== 'undefined';
        const hasBuildScript = typeof manifest.scripts.build === 'string' && manifest.scripts.build.trim().length > 0;
        const hasTestScript = typeof manifest.scripts.test === 'string' && manifest.scripts.test.trim().length > 0;
        const absolutePackageDir = path.resolve(this.repoRoot, manifest.directory);
        const mainEntryPath = hasMainField
            ? normalizePath(path.join(absolutePackageDir, manifest.main))
            : undefined;
        const mainEntryExists = mainEntryPath ? fs.existsSync(mainEntryPath) : false;
        let resolvedFromWorkspace = false;
        let resolvedPath;
        try {
            resolvedPath = normalizePath(this.rootRequire.resolve(packageName));
            resolvedFromWorkspace = true;
        }
        catch {
            resolvedFromWorkspace = false;
        }
        let loadAttempted = false;
        let loadMode = 'none';
        let loadSucceeded = false;
        let loadError;
        if (options.loadRuntime && resolvedPath) {
            loadAttempted = true;
            loadMode = 'resolve';
            try {
                await import(pathToFileURL(resolvedPath).href);
                loadSucceeded = true;
            }
            catch (error) {
                loadSucceeded = false;
                loadError = error instanceof Error ? error.message : String(error);
            }
        }
        else if (options.loadRuntime &&
            mainEntryExists &&
            mainEntryPath &&
            /\.(cjs|mjs|js)$/i.test(mainEntryPath)) {
            loadAttempted = true;
            loadMode = 'entry';
            try {
                await import(pathToFileURL(mainEntryPath).href);
                loadSucceeded = true;
            }
            catch (error) {
                loadSucceeded = false;
                loadError = error instanceof Error ? error.message : String(error);
            }
        }
        return {
            packageName: manifest.name,
            packageDir: manifest.directory,
            hasMainField,
            hasTypesField,
            hasExportsField,
            hasBuildScript,
            hasTestScript,
            mainEntryPath,
            mainEntryExists,
            resolvedFromWorkspace,
            resolvedPath,
            loadAttempted,
            loadMode,
            loadSucceeded,
            loadError,
        };
    }
    async probeAll(options = {}) {
        const manifests = this.listPackages();
        const results = [];
        for (const manifest of manifests) {
            results.push(await this.probePackage(manifest.name, options));
        }
        return results;
    }
}
//# sourceMappingURL=PackageReconnectHub.js.map