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
exports.UpgradeService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const VERSION_MANIFEST_URL = 'https://releases.thenewfuse.com/tnf-cli/versions.json';
class UpgradeService {
    constructor() {
        this.configDir = path.join(os.homedir(), '.config', 'tnf');
    }
    getCurrentVersion() {
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return pkg.version || '1.0.0';
        }
        catch {
            return '1.0.0';
        }
    }
    async getLatestVersion() {
        try {
            const response = await fetch(VERSION_MANIFEST_URL);
            if (!response.ok)
                return '1.0.0';
            const data = await response.json();
            return data.latest || '1.0.0';
        }
        catch {
            return this.getCurrentVersion();
        }
    }
    async getAvailableVersions() {
        try {
            const response = await fetch(VERSION_MANIFEST_URL);
            if (!response.ok)
                return [this.getCurrentVersion()];
            const data = await response.json();
            return data.versions || [this.getCurrentVersion()];
        }
        catch {
            return [this.getCurrentVersion()];
        }
    }
    async upgrade(options = {}) {
        const currentVersion = this.getCurrentVersion();
        const targetVersion = options.target || await this.getLatestVersion();
        if (targetVersion === currentVersion) {
            return {
                success: true,
                previousVersion: currentVersion,
                newVersion: currentVersion,
                message: `Already at version ${currentVersion}`,
            };
        }
        const method = options.method || this.detectInstallMethod();
        switch (method) {
            case 'npm':
                return this.upgradeViaNpm(targetVersion);
            case 'pnpm':
                return this.upgradeViaPnpm(targetVersion);
            case 'bun':
                return this.upgradeViaBun(targetVersion);
            case 'brew':
                return this.upgradeViaBrew(targetVersion);
            case 'curl':
            default:
                return this.upgradeViaCurl(targetVersion);
        }
    }
    detectInstallMethod() {
        if (this.isInstalledViaBrew())
            return 'brew';
        if (this.isInstalledViaPnpm())
            return 'pnpm';
        if (this.isInstalledViaBun())
            return 'bun';
        if (this.isInstalledViaNpm())
            return 'npm';
        return 'curl';
    }
    isInstalledViaBrew() {
        const result = (0, child_process_1.spawnSync)('brew', ['list', 'tnf-cli'], { encoding: 'utf8' });
        return result.status === 0;
    }
    isInstalledViaNpm() {
        const result = (0, child_process_1.spawnSync)('npm', ['list', '-g', '@the-new-fuse/tnf-cli'], { encoding: 'utf8' });
        return result.status === 0;
    }
    isInstalledViaPnpm() {
        const result = (0, child_process_1.spawnSync)('pnpm', ['list', '-g', '@the-new-fuse/tnf-cli'], { encoding: 'utf8' });
        return result.status === 0;
    }
    isInstalledViaBun() {
        const result = (0, child_process_1.spawnSync)('bun', ['pm', 'ls', '-g'], { encoding: 'utf8' });
        return result.status === 0 && result.stdout.includes('@the-new-fuse/tnf-cli');
    }
    async upgradeViaNpm(version) {
        const currentVersion = this.getCurrentVersion();
        try {
            const result = (0, child_process_1.spawnSync)('npm', ['install', '-g', `@the-new-fuse/tnf-cli@${version}`], {
                encoding: 'utf8',
                stdio: 'inherit',
            });
            if (result.status === 0) {
                return {
                    success: true,
                    previousVersion: currentVersion,
                    newVersion: version,
                    message: `Upgraded from ${currentVersion} to ${version} via npm`,
                };
            }
            return {
                success: false,
                previousVersion: currentVersion,
                message: `npm upgrade failed with exit code ${result.status}`,
            };
        }
        catch (e) {
            return {
                success: false,
                previousVersion: currentVersion,
                message: `npm upgrade failed: ${e.message}`,
            };
        }
    }
    async upgradeViaPnpm(version) {
        const currentVersion = this.getCurrentVersion();
        try {
            const result = (0, child_process_1.spawnSync)('pnpm', ['add', '-g', `@the-new-fuse/tnf-cli@${version}`], {
                encoding: 'utf8',
                stdio: 'inherit',
            });
            if (result.status === 0) {
                return {
                    success: true,
                    previousVersion: currentVersion,
                    newVersion: version,
                    message: `Upgraded from ${currentVersion} to ${version} via pnpm`,
                };
            }
            return {
                success: false,
                previousVersion: currentVersion,
                message: `pnpm upgrade failed with exit code ${result.status}`,
            };
        }
        catch (e) {
            return {
                success: false,
                previousVersion: currentVersion,
                message: `pnpm upgrade failed: ${e.message}`,
            };
        }
    }
    async upgradeViaBun(version) {
        const currentVersion = this.getCurrentVersion();
        try {
            const result = (0, child_process_1.spawnSync)('bun', ['install', '-g', `@the-new-fuse/tnf-cli@${version}`], {
                encoding: 'utf8',
                stdio: 'inherit',
            });
            if (result.status === 0) {
                return {
                    success: true,
                    previousVersion: currentVersion,
                    newVersion: version,
                    message: `Upgraded from ${currentVersion} to ${version} via bun`,
                };
            }
            return {
                success: false,
                previousVersion: currentVersion,
                message: `bun upgrade failed with exit code ${result.status}`,
            };
        }
        catch (e) {
            return {
                success: false,
                previousVersion: currentVersion,
                message: `bun upgrade failed: ${e.message}`,
            };
        }
    }
    async upgradeViaBrew(version) {
        const currentVersion = this.getCurrentVersion();
        try {
            const result = (0, child_process_1.spawnSync)('brew', ['upgrade', 'tnf-cli'], {
                encoding: 'utf8',
                stdio: 'inherit',
            });
            if (result.status === 0) {
                return {
                    success: true,
                    previousVersion: currentVersion,
                    newVersion: version,
                    message: `Upgraded from ${currentVersion} to ${version} via brew`,
                };
            }
            return {
                success: false,
                previousVersion: currentVersion,
                message: `brew upgrade failed with exit code ${result.status}`,
            };
        }
        catch (e) {
            return {
                success: false,
                previousVersion: currentVersion,
                message: `brew upgrade failed: ${e.message}`,
            };
        }
    }
    async upgradeViaCurl(version) {
        const currentVersion = this.getCurrentVersion();
        const installUrl = `https://get.thenewfuse.com/tnf-cli/${version}`;
        try {
            const result = (0, child_process_1.spawnSync)('curl', ['-fsSL', installUrl, '|', 'sh'], {
                encoding: 'utf8',
                shell: true,
                stdio: 'inherit',
            });
            if (result.status === 0) {
                return {
                    success: true,
                    previousVersion: currentVersion,
                    newVersion: version,
                    message: `Upgraded from ${currentVersion} to ${version} via curl`,
                };
            }
            return {
                success: false,
                previousVersion: currentVersion,
                message: `curl upgrade failed with exit code ${result.status}`,
            };
        }
        catch (e) {
            return {
                success: false,
                previousVersion: currentVersion,
                message: `curl upgrade failed: ${e.message}`,
            };
        }
    }
    async uninstall() {
        const method = this.detectInstallMethod();
        try {
            switch (method) {
                case 'brew':
                    (0, child_process_1.spawnSync)('brew', ['uninstall', 'tnf-cli'], { stdio: 'inherit' });
                    break;
                case 'npm':
                    (0, child_process_1.spawnSync)('npm', ['uninstall', '-g', '@the-new-fuse/tnf-cli'], { stdio: 'inherit' });
                    break;
                case 'pnpm':
                    (0, child_process_1.spawnSync)('pnpm', ['remove', '-g', '@the-new-fuse/tnf-cli'], { stdio: 'inherit' });
                    break;
                case 'bun':
                    (0, child_process_1.spawnSync)('bun', ['remove', '-g', '@the-new-fuse/tnf-cli'], { stdio: 'inherit' });
                    break;
                default:
                    // Remove manually installed binary
                    const binPath = '/usr/local/bin/tnf';
                    if (fs.existsSync(binPath)) {
                        fs.rmSync(binPath);
                    }
            }
            // Clean up config and data directories
            const configDir = path.join(os.homedir(), '.config', 'tnf');
            const dataDir = path.join(os.homedir(), '.local', 'share', 'tnf');
            const cacheDir = path.join(os.homedir(), '.cache', 'tnf');
            for (const dir of [configDir, dataDir, cacheDir]) {
                if (fs.existsSync(dir)) {
                    fs.rmSync(dir, { recursive: true });
                }
            }
            return {
                success: true,
                message: 'TNF CLI uninstalled successfully. Configuration and data directories removed.',
            };
        }
        catch (e) {
            return {
                success: false,
                message: `Uninstall failed: ${e.message}`,
            };
        }
    }
}
exports.UpgradeService = UpgradeService;
//# sourceMappingURL=UpgradeService.js.map