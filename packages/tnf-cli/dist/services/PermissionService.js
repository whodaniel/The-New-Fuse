import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Minimatch } from 'minimatch';
import { stripJsoncComments } from '../utils/jsonc.js';
export class PermissionService {
    constructor(configDir, projectRoot) {
        this.globalConfig = null;
        this.projectConfig = null;
        this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf');
        this.projectRoot = projectRoot || null;
        this.loadGlobalConfig();
        this.loadProjectConfig();
    }
    loadConfigFromPath(configPath) {
        if (!fs.existsSync(configPath))
            return null;
        try {
            let raw = fs.readFileSync(configPath, 'utf8');
            if (configPath.endsWith('.jsonc')) {
                raw = stripJsoncComments(raw);
            }
            const data = JSON.parse(raw);
            if (data.permission) {
                return {
                    bash: data.permission.bash || {},
                    read: data.permission.read || {},
                    external_directory: data.permission.external_directory || {},
                };
            }
            return null;
        }
        catch {
            return null;
        }
    }
    loadGlobalConfig() {
        const jsoncPath = path.join(this.configDir, 'tnf.jsonc');
        const jsonPath = path.join(this.configDir, 'config.json');
        this.globalConfig = this.loadConfigFromPath(jsoncPath) || this.loadConfigFromPath(jsonPath);
    }
    loadProjectConfig() {
        if (!this.projectRoot)
            return;
        const jsoncPath = path.join(this.projectRoot, 'tnf.jsonc');
        const jsonPath = path.join(this.projectRoot, 'tnf.json');
        this.projectConfig = this.loadConfigFromPath(jsoncPath) || this.loadConfigFromPath(jsonPath);
    }
    matchPattern(pattern, value) {
        if (pattern === '*')
            return true;
        const mm = new Minimatch(pattern, { nocase: process.platform === 'win32' });
        return mm.match(value);
    }
    checkRules(rules, value) {
        const sortedPatterns = Object.entries(rules).sort(([a], [b]) => {
            const aSpecificity = a.includes('*') ? a.split('*').length : 0;
            const bSpecificity = b.includes('*') ? b.split('*').length : 0;
            return bSpecificity - aSpecificity;
        });
        for (const [pattern, action] of sortedPatterns) {
            if (this.matchPattern(pattern, value)) {
                return { matched: true, pattern, action };
            }
        }
        return { matched: false };
    }
    checkBashCommand(command) {
        const trimmed = command.trim();
        const cmdPart = trimmed.split(/\s+/)[0] || trimmed;
        if (this.projectConfig) {
            const result = this.checkRules(this.projectConfig.bash, trimmed);
            if (result.matched) {
                return { allowed: result.action === 'allow', matchedRule: result.pattern, action: result.action, source: 'project' };
            }
            const cmdResult = this.checkRules(this.projectConfig.bash, cmdPart + ' *');
            if (cmdResult.matched) {
                return { allowed: cmdResult.action === 'allow', matchedRule: cmdResult.pattern, action: cmdResult.action, source: 'project' };
            }
        }
        if (this.globalConfig) {
            const result = this.checkRules(this.globalConfig.bash, trimmed);
            if (result.matched) {
                return { allowed: result.action === 'allow', matchedRule: result.pattern, action: result.action, source: 'global' };
            }
            const cmdResult = this.checkRules(this.globalConfig.bash, cmdPart + ' *');
            if (cmdResult.matched) {
                return { allowed: cmdResult.action === 'allow', matchedRule: cmdResult.pattern, action: cmdResult.action, source: 'global' };
            }
        }
        return { allowed: true, source: 'default' };
    }
    checkReadPath(filePath) {
        if (this.projectConfig) {
            const result = this.checkRules(this.projectConfig.read, filePath);
            if (result.matched) {
                return { allowed: result.action === 'allow', matchedRule: result.pattern, action: result.action, source: 'project' };
            }
        }
        if (this.globalConfig) {
            const result = this.checkRules(this.globalConfig.read, filePath);
            if (result.matched) {
                return { allowed: result.action === 'allow', matchedRule: result.pattern, action: result.action, source: 'global' };
            }
        }
        return { allowed: true, source: 'default' };
    }
    checkExternalDirectory(dirPath) {
        if (this.projectConfig) {
            const result = this.checkRules(this.projectConfig.external_directory, dirPath);
            if (result.matched) {
                return { allowed: result.action === 'allow', matchedRule: result.pattern, action: result.action, source: 'project' };
            }
        }
        if (this.globalConfig) {
            const result = this.checkRules(this.globalConfig.external_directory, dirPath);
            if (result.matched) {
                return { allowed: result.action === 'allow', matchedRule: result.pattern, action: result.action, source: 'global' };
            }
        }
        return { allowed: true, source: 'default' };
    }
    getEffectiveConfig() {
        return {
            global: this.globalConfig,
            project: this.projectConfig,
        };
    }
    listBashRules() {
        const rules = [];
        if (this.globalConfig) {
            for (const [pattern, action] of Object.entries(this.globalConfig.bash)) {
                rules.push({ pattern, action, source: 'global' });
            }
        }
        if (this.projectConfig) {
            for (const [pattern, action] of Object.entries(this.projectConfig.bash)) {
                rules.push({ pattern, action, source: 'project' });
            }
        }
        return rules;
    }
    listReadRules() {
        const rules = [];
        if (this.globalConfig) {
            for (const [pattern, action] of Object.entries(this.globalConfig.read)) {
                rules.push({ pattern, action, source: 'global' });
            }
        }
        if (this.projectConfig) {
            for (const [pattern, action] of Object.entries(this.projectConfig.read)) {
                rules.push({ pattern, action, source: 'project' });
            }
        }
        return rules;
    }
    listExternalDirectoryRules() {
        const rules = [];
        if (this.globalConfig) {
            for (const [pattern, action] of Object.entries(this.globalConfig.external_directory)) {
                rules.push({ pattern, action, source: 'global' });
            }
        }
        if (this.projectConfig) {
            for (const [pattern, action] of Object.entries(this.projectConfig.external_directory)) {
                rules.push({ pattern, action, source: 'project' });
            }
        }
        return rules;
    }
    addBashRule(pattern, action, scope = 'global') {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!target)
            return;
        target.bash[pattern] = action;
        this.saveConfig(scope);
    }
    addReadRule(pattern, action, scope = 'global') {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!target)
            return;
        target.read[pattern] = action;
        this.saveConfig(scope);
    }
    addExternalDirectoryRule(pattern, action, scope = 'global') {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!target)
            return;
        target.external_directory[pattern] = action;
        this.saveConfig(scope);
    }
    removeBashRule(pattern, scope = 'global') {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!target || !(pattern in target.bash))
            return false;
        delete target.bash[pattern];
        this.saveConfig(scope);
        return true;
    }
    removeReadRule(pattern, scope = 'global') {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!target || !(pattern in target.read))
            return false;
        delete target.read[pattern];
        this.saveConfig(scope);
        return true;
    }
    removeExternalDirectoryRule(pattern, scope = 'global') {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!target || !(pattern in target.external_directory))
            return false;
        delete target.external_directory[pattern];
        this.saveConfig(scope);
        return true;
    }
    stripJsoncCommentsPublic(content) {
        return stripJsoncComments(content);
    }
    ensureConfig(scope) {
        const target = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (target)
            return target;
        const newConfig = {
            bash: {},
            read: {},
            external_directory: {},
        };
        if (scope === 'global') {
            this.globalConfig = newConfig;
        }
        else {
            this.projectConfig = newConfig;
        }
        return newConfig;
    }
    saveConfig(scope) {
        const config = scope === 'global' ? this.globalConfig : this.projectConfig;
        if (!config)
            return;
        if (scope === 'global') {
            const jsoncPath = path.join(this.configDir, 'tnf.jsonc');
            const jsonPath = path.join(this.configDir, 'config.json');
            const targetPath = fs.existsSync(jsoncPath) ? jsoncPath : (fs.existsSync(jsonPath) ? jsonPath : jsoncPath);
            let existing = {};
            if (fs.existsSync(targetPath)) {
                try {
                    let raw = fs.readFileSync(targetPath, 'utf8');
                    if (targetPath.endsWith('.jsonc')) {
                        raw = stripJsoncComments(raw);
                    }
                    existing = JSON.parse(raw);
                }
                catch { }
            }
            existing['permission'] = {
                bash: config.bash,
                read: config.read,
                external_directory: config.external_directory,
            };
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2));
        }
        else if (this.projectRoot) {
            const jsoncPath = path.join(this.projectRoot, 'tnf.jsonc');
            const jsonPath = path.join(this.projectRoot, 'tnf.json');
            const targetPath = fs.existsSync(jsoncPath) ? jsoncPath : (fs.existsSync(jsonPath) ? jsonPath : jsonPath);
            let existing = {};
            if (fs.existsSync(targetPath)) {
                try {
                    let raw = fs.readFileSync(targetPath, 'utf8');
                    if (targetPath.endsWith('.jsonc')) {
                        raw = stripJsoncComments(raw);
                    }
                    existing = JSON.parse(raw);
                }
                catch { }
            }
            existing['permission'] = {
                bash: config.bash,
                read: config.read,
                external_directory: config.external_directory,
            };
            fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2));
        }
    }
}
//# sourceMappingURL=PermissionService.js.map