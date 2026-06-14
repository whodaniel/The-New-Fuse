import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawnSync } from 'child_process';
import { stripJsoncComments } from '../utils/jsonc.js';
export class DebugService {
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
        const jsoncPath = path.join(this.configDir, 'tnf.jsonc');
        const jsonPath = path.join(this.configDir, 'config.json');
        const configPath = fs.existsSync(jsoncPath) ? jsoncPath : jsonPath;
        if (fs.existsSync(configPath)) {
            try {
                let raw = fs.readFileSync(configPath, 'utf8');
                if (configPath.endsWith('.jsonc')) {
                    raw = stripJsoncComments(raw);
                }
                const data = JSON.parse(raw);
                config.$schema = data.$schema;
                config.provider = data.provider;
                config.model = data.model;
                config.apiBaseUrl = data.apiBaseUrl;
                config.permission = data.permission;
                config.mcp = data.mcp;
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
    getProjectConfig(projectRoot) {
        const root = projectRoot || process.cwd();
        const config = {};
        const jsoncPath = path.join(root, 'tnf.jsonc');
        const jsonPath = path.join(root, 'tnf.json');
        const configPath = fs.existsSync(jsoncPath) ? jsoncPath : (fs.existsSync(jsonPath) ? jsonPath : null);
        if (configPath && fs.existsSync(configPath)) {
            try {
                let raw = fs.readFileSync(configPath, 'utf8');
                if (configPath.endsWith('.jsonc')) {
                    raw = stripJsoncComments(raw);
                }
                const data = JSON.parse(raw);
                config.$schema = data.$schema;
                config.provider = data.provider;
                config.model = data.model;
                config.apiBaseUrl = data.apiBaseUrl;
                config.permission = data.permission;
                config.mcp = data.mcp;
                config.mcpServers = data.mcpServers;
                config.agents = data.agents;
                config.custom = data.custom;
            }
            catch { }
        }
        return config;
    }
    getProjectCommands(projectRoot) {
        const root = projectRoot || process.cwd();
        const commandDir = path.join(root, '.tnf', 'command');
        const commands = [];
        if (fs.existsSync(commandDir)) {
            try {
                const entries = fs.readdirSync(commandDir);
                for (const entry of entries) {
                    if (entry.endsWith('.md')) {
                        commands.push({ name: entry.replace(/\.md$/, ''), filePath: path.join(commandDir, entry) });
                    }
                }
            }
            catch { }
        }
        return commands;
    }
    getProjectAgents(projectRoot) {
        const root = projectRoot || process.cwd();
        const agentDir = path.join(root, '.tnf', 'agent');
        const agents = [];
        if (fs.existsSync(agentDir)) {
            try {
                const entries = fs.readdirSync(agentDir);
                for (const entry of entries) {
                    if (entry.endsWith('.md')) {
                        agents.push({ name: entry.replace(/\.md$/, ''), filePath: path.join(agentDir, entry) });
                    }
                }
            }
            catch { }
        }
        return agents;
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
            const result = spawnSync('which', ['typescript-language-server'], { encoding: 'utf8' });
            if (result.status === 0) {
                const serverPath = result.stdout.trim();
                const versionResult = spawnSync('typescript-language-server', ['--version'], { encoding: 'utf8' });
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
            const result = spawnSync('which', ['rg'], { encoding: 'utf8' });
            if (result.status === 0) {
                const rgPath = result.stdout.trim();
                const versionResult = spawnSync('rg', ['--version'], { encoding: 'utf8' });
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
        const globalConfig = this.getConfig();
        const projectConfig = this.getProjectConfig();
        const snapshot = {
            timestamp: new Date().toISOString(),
            paths: this.getPaths(),
            config: globalConfig,
            projectConfig: Object.keys(projectConfig).length > 0 ? projectConfig : undefined,
            projectCommands: this.getProjectCommands(),
            projectAgents: this.getProjectAgents(),
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
//# sourceMappingURL=DebugService.js.map