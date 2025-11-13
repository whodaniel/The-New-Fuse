import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
/**
 * VS Code Server Configuration Manager
 */
export class VSCodeServerConfigManager {
    configDir;
    globalConfigPath;
    defaultConfig;
    constructor() {
        this.configDir = path.join(os.homedir(), '.tnf', 'vscode-server');
        this.globalConfigPath = path.join(this.configDir, 'config.json');
        this.defaultConfig = {
            defaultAuthProvider: 'github',
            tunnelNamePattern: '{username}-{project}-{timestamp}',
            autoWorkspace: true,
            backgroundMode: false,
            verboseLogging: false,
            maxTunnels: 5,
            tunnelTimeout: 60000,
            autoCleanup: true,
            extensions: [],
            workspaceSettings: {}
        };
    }
    /**
     * Get global configuration
     */
    async getGlobalConfig() {
        try {
            await this.ensureConfigDir();
            const configData = await fs.readFile(this.globalConfigPath, 'utf-8');
            const config = JSON.parse(configData);
            return { ...this.defaultConfig, ...config };
        }
        catch (error) {
            // Return default config if file doesn't exist
            return this.defaultConfig;
        }
    }
    /**
     * Set global configuration
     */
    async setGlobalConfig(config) {
        const currentConfig = await this.getGlobalConfig();
        const newConfig = { ...currentConfig, ...config };
        await this.ensureConfigDir();
        await fs.writeFile(this.globalConfigPath, JSON.stringify(newConfig, null, 2));
    }
    /**
     * Get project-specific configuration
     */
    async getProjectConfig(projectPath = process.cwd()) {
        try {
            const tnfDir = path.join(projectPath, '.tnf');
            const projectConfigPath = path.join(tnfDir, 'vscode-server.json');
            const configData = await fs.readFile(projectConfigPath, 'utf-8');
            return JSON.parse(configData);
        }
        catch (error) {
            // Return empty config if file doesn't exist
            return {};
        }
    }
    /**
     * Set project-specific configuration
     */
    async setProjectConfig(config, projectPath = process.cwd()) {
        const tnfDir = path.join(projectPath, '.tnf');
        const projectConfigPath = path.join(tnfDir, 'vscode-server.json');
        // Ensure .tnf directory exists
        await fs.mkdir(tnfDir, { recursive: true });
        // Merge with existing config
        const currentConfig = await this.getProjectConfig(projectPath);
        const newConfig = { ...currentConfig, ...config };
        await fs.writeFile(projectConfigPath, JSON.stringify(newConfig, null, 2));
    }
    /**
     * Get merged configuration (global + project)
     */
    async getMergedConfig(projectPath = process.cwd()) {
        const globalConfig = await this.getGlobalConfig();
        const projectConfig = await this.getProjectConfig(projectPath);
        return {
            ...globalConfig,
            ...projectConfig
        };
    }
    /**
     * Generate tunnel name based on pattern
     */
    generateTunnelName(pattern, projectPath = process.cwd()) {
        const username = os.userInfo().username;
        const projectName = path.basename(projectPath);
        const timestamp = Date.now().toString(36);
        const date = new Date().toISOString().split('T')[0];
        return pattern
            .replace('{username}', username)
            .replace('{project}', projectName)
            .replace('{timestamp}', timestamp)
            .replace('{date}', date)
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];
        if (config.defaultAuthProvider && !['github', 'microsoft'].includes(config.defaultAuthProvider)) {
            errors.push('defaultAuthProvider must be "github" or "microsoft"');
        }
        if (config.maxTunnels && (config.maxTunnels < 1 || config.maxTunnels > 20)) {
            errors.push('maxTunnels must be between 1 and 20');
        }
        if (config.tunnelTimeout && config.tunnelTimeout < 10000) {
            errors.push('tunnelTimeout must be at least 10000ms (10 seconds)');
        }
        if (config.tunnelNamePattern && !config.tunnelNamePattern.includes('{project}')) {
            errors.push('tunnelNamePattern must include {project} placeholder');
        }
        return errors;
    }
    /**
     * Reset configuration to defaults
     */
    async resetGlobalConfig() {
        await this.ensureConfigDir();
        await fs.writeFile(this.globalConfigPath, JSON.stringify(this.defaultConfig, null, 2));
    }
    /**
     * Remove project configuration
     */
    async removeProjectConfig(projectPath = process.cwd()) {
        try {
            const tnfDir = path.join(projectPath, '.tnf');
            const projectConfigPath = path.join(tnfDir, 'vscode-server.json');
            await fs.unlink(projectConfigPath);
        }
        catch (error) {
            // File doesn't exist, which is fine
        }
    }
    /**
     * Get configuration summary
     */
    async getConfigSummary(projectPath = process.cwd()) {
        const globalConfig = await this.getGlobalConfig();
        const projectConfig = await this.getProjectConfig(projectPath);
        const mergedConfig = await this.getMergedConfig(projectPath);
        const tunnelName = this.generateTunnelName(globalConfig.tunnelNamePattern, projectPath);
        return {
            global: globalConfig,
            project: projectConfig,
            merged: mergedConfig,
            tunnelName
        };
    }
    /**
     * Export configuration
     */
    async exportConfig(projectPath = process.cwd()) {
        return {
            global: await this.getGlobalConfig(),
            project: await this.getProjectConfig(projectPath)
        };
    }
    /**
     * Import configuration
     */
    async importConfig(config, projectPath = process.cwd()) {
        if (config.global) {
            const errors = this.validateConfig(config.global);
            if (errors.length > 0) {
                throw new Error(`Invalid global configuration: ${errors.join(', ')});
      }
      await this.setGlobalConfig(config.global);
    }
    
    if (config.project) {
      await this.setProjectConfig(config.project, projectPath);
    }
  }

  /**
   * Ensure configuration directory exists
   */
  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {`);
                throw new Error(`Failed to create config directory: ${error}` `);
    }
  }
}

/**
 * Default configuration manager instance
 */
export const vscodeServerConfig = new VSCodeServerConfigManager();
                );
            }
        }
    }
}
//# sourceMappingURL=vscode-server-config.js.map