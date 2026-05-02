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
exports.DebugService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
class DebugService {
    constructor() {
        this.configDir = path.join(os.homedir(), '.config', 'tnf');
        this.dataDir = path.join(os.homedir(), '.local', 'share', 'tnf');
    }
    getPaths() {
        return {
            config: this.configDir,
            data: this.dataDir,
            cache: path.join(os.homedir(), '.cache', 'tnf'),
            state: path.join(os.homedir(), '.local', 'state', 'tnf'),
            logs: path.join(this.dataDir, 'logs'),
        };
    }
    getConfig() {
        const config = {};
        const configPath = path.join(this.configDir, 'config.json');
        if (fs.existsSync(configPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                config.provider = data.provider;
                config.model = data.model;
                config.apiBaseUrl = data.apiBaseUrl;
                config.mcpServers = data.mcpServers;
                config.agents = data.agents;
                config.custom = data.custom;
            }
            catch { }
        }
        const envConfig = {
            provider: process.env.TNF_LLM_PROVIDER,
            model: process.env.TNF_LLM_MODEL || process.env.OPENAI_MODEL,
            apiBaseUrl: process.env.TNF_LLM_BASE_URL || process.env.OPENAI_API_BASE,
        };
        if (!config.provider && envConfig.provider)
            config.provider = envConfig.provider;
        if (!config.model && envConfig.model)
            config.model = envConfig.model;
        if (!config.apiBaseUrl && envConfig.apiBaseUrl)
            config.apiBaseUrl = envConfig.apiBaseUrl;
        return config;
    }
    getConfigPath(key) {
        const config = this.getConfig();
        const parts = key.split('.');
        let value = config;
        for (const part of parts) {
            if (typeof value === 'object' && value !== null && part in value) {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    listProjects() {
        const projectsPath = path.join(this.dataDir, 'projects.json');
        if (!fs.existsSync(projectsPath))
            return [];
        try {
            const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
            return Array.isArray(projects) ? projects : [];
        }
        catch {
            return [];
        }
    }
    listSkills() {
        const skills = [];
        const tnfSkillsDir = path.join(this.configDir, 'skills');
        if (fs.existsSync(tnfSkillsDir)) {
            this.walkDir(tnfSkillsDir, (filePath) => {
                if (filePath.endsWith('.md') || filePath.endsWith('SKILL.md')) {
                    skills.push({
                        name: path.basename(filePath, path.extname(filePath)),
                        source: 'tnf',
                        path: filePath,
                    });
                }
            });
        }
        const claudeSkillsDir = path.join(os.homedir(), '.claude', 'skills');
        if (fs.existsSync(claudeSkillsDir)) {
            this.walkDir(claudeSkillsDir, (filePath) => {
                if (filePath.endsWith('.md') || filePath.endsWith('SKILL.md')) {
                    skills.push({
                        name: path.basename(filePath, path.extname(filePath)),
                        source: 'claude',
                        path: filePath,
                    });
                }
            });
        }
        return skills;
    }
    walkDir(dir, callback) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    this.walkDir(fullPath, callback);
                }
                else if (entry.isFile()) {
                    callback(fullPath);
                }
            }
        }
        catch { }
    }
    debugLSP() {
        try {
            const result = (0, child_process_1.spawnSync)('which', ['typescript-language-server'], { encoding: 'utf8' });
            if (result.status === 0) {
                const serverPath = result.stdout.trim();
                const versionResult = (0, child_process_1.spawnSync)('typescript-language-server', ['--version'], { encoding: 'utf8' });
                return {
                    available: true,
                    path: serverPath,
                    version: versionResult.stdout.trim() || undefined,
                };
            }
        }
        catch (e) {
            return { available: false, error: e.message };
        }
        return { available: false };
    }
    debugRg() {
        try {
            const result = (0, child_process_1.spawnSync)('which', ['rg'], { encoding: 'utf8' });
            if (result.status === 0) {
                const rgPath = result.stdout.trim();
                const versionResult = (0, child_process_1.spawnSync)('rg', ['--version'], { encoding: 'utf8' });
                return {
                    available: true,
                    path: rgPath,
                    version: versionResult.stdout.split('\n')[0] || undefined,
                };
            }
        }
        catch (e) {
            return { available: false, error: e.message };
        }
        return { available: false };
    }
    debugFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return { exists: false };
            }
            const stats = fs.statSync(filePath);
            const mode = stats.mode.toString(8).slice(-3);
            return {
                exists: true,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                permissions: mode,
            };
        }
        catch (e) {
            return { exists: false, error: e.message };
        }
    }
    createSnapshot(outputPath) {
        const snapshot = {
            timestamp: new Date().toISOString(),
            paths: this.getPaths(),
            config: this.getConfig(),
            lsp: this.debugLSP(),
            rg: this.debugRg(),
            projects: this.listProjects(),
            skills: this.listSkills(),
        };
        const snapshotPath = outputPath || path.join(this.dataDir, 'snapshots', `snapshot-${Date.now()}.json`);
        const snapshotDir = path.dirname(snapshotPath);
        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }
        fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
        return { path: snapshotPath, data: snapshot };
    }
}
exports.DebugService = DebugService;
//# sourceMappingURL=DebugService.js.map