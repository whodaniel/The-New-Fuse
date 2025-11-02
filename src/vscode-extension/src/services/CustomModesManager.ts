import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CustomMode {
    name: string;
    slug: string;
    roleDefinition: string;
    color?: string;
    model?: string;
    tools?: string[];
    capabilities?: string[];
}

export class CustomModesManager {
    private context: vscode.ExtensionContext;
    private customModes: Map<string, CustomMode> = new Map();
    private readonly CUSTOM_MODES_KEY = 'theNewFuse.customModes';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadCustomModes();
    }

    /**
     * Load custom modes from VSCode configuration
     */
    private loadCustomModes(): void {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        const modes = config.get<CustomMode[]>('customModes') || [];

        this.customModes.clear();
        modes.forEach(mode => {
            this.customModes.set(mode.slug, mode);
        });
    }

    /**
     * Get all available custom modes
     */
    getCustomModes(): CustomMode[] {
        return Array.from(this.customModes.values());
    }

    /**
     * Get a specific custom mode by slug
     */
    getCustomMode(slug: string): CustomMode | undefined {
        return this.customModes.get(slug);
    }

    /**
     * Add or update a custom mode
     */
    async addCustomMode(mode: CustomMode): Promise<void> {
        this.customModes.set(mode.slug, mode);
        await this.saveCustomModes();
    }

    /**
     * Remove a custom mode
     */
    async removeCustomMode(slug: string): Promise<void> {
        this.customModes.delete(slug);
        await this.saveCustomModes();
    }

    /**
     * Save custom modes to VSCode configuration
     */
    private async saveCustomModes(): Promise<void> {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        const modes = Array.from(this.customModes.values());
        await config.update('customModes', modes, vscode.ConfigurationTarget.Global);
    }

    /**
     * Import custom modes from external file
     */
    async importCustomModes(filePath: string): Promise<void> {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const importedModes = JSON.parse(fileContent);

            if (Array.isArray(importedModes)) {
                for (const mode of importedModes) {
                    if (mode.slug && mode.roleDefinition) {
                        this.customModes.set(mode.slug, mode);
                    }
                }
                await this.saveCustomModes();
                vscode.window.showInformationMessage(`Successfully imported ${this.customModes.size} custom modes`);
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import custom modes: ${error}`);
        }
    }

    /**
     * Export custom modes to file
     */
    async exportCustomModes(filePath: string): Promise<void> {
        try {
            const modes = Array.from(this.customModes.values());
            fs.writeFileSync(filePath, JSON.stringify(modes, null, 2));
            vscode.window.showInformationMessage(`Successfully exported ${modes.length} custom modes to ${filePath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export custom modes: ${error}`);
        }
    }

    /**
     * Get available mode slugs for quick access
     */
    getAvailableModeSlugs(): string[] {
        return Array.from(this.customModes.keys());
    }

    /**
     * Validate custom mode structure
     */
    validateCustomMode(mode: any): mode is CustomMode {
        return mode &&
               typeof mode.name === 'string' &&
               typeof mode.slug === 'string' &&
               typeof mode.roleDefinition === 'string';
    }

    /**
     * Create default custom modes if none exist
     */
    async createDefaultModes(): Promise<void> {
        if (this.customModes.size === 0) {
            await this.loadFromConfigFile();
        }
    }

    /**
     * Load custom modes from configuration file
     */
    async loadFromConfigFile(): Promise<void> {
        try {
            const configPath = path.join(this.context.extensionPath, 'custom-modes-config.json');
            if (fs.existsSync(configPath)) {
                const fileContent = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(fileContent);

                if (config.customModes && Array.isArray(config.customModes)) {
                    for (const mode of config.customModes) {
                        if (this.validateCustomMode(mode)) {
                            this.customModes.set(mode.slug, mode);
                        }
                    }
                    await this.saveCustomModes();
                    vscode.window.showInformationMessage(`Loaded ${this.customModes.size} custom modes from configuration file`);
                }
            } else {
                // Fallback to hardcoded defaults if config file doesn't exist
                await this.createHardcodedDefaults();
            }
        } catch (error) {
            console.error('Error loading custom modes from config file:', error);
            await this.createHardcodedDefaults();
        }
    }

    /**
     * Create hardcoded default modes as fallback
     */
    private async createHardcodedDefaults(): Promise<void> {
        const defaultModes: CustomMode[] = [
            {
                name: "Codebase Pathway Tracer",
                slug: "codebase-pathway-tracer",
                roleDefinition: "You are an expert Technical Architect & Code Analyst specializing in codebase pathway analysis. You trace logical pathways through codebases, analyzing code structure, data flow, execution paths, dependency relationships, and architectural patterns to map comprehensive logical pathways."
            },
            {
                name: "Meta Agent Architect",
                slug: "meta-agent-architect",
                roleDefinition: "You are an expert Agent Designer & System Architect who designs and generates complete AI agent configurations. You analyze user requirements to create specialized agents with appropriate tools, capabilities, and domain expertise."
            },
            {
                name: "Visual Asset Creator",
                slug: "visual-asset-creator",
                roleDefinition: "You are a Visual Designer & Asset Manager who creates compelling visual assets for content. You source high-quality stock photos, generate custom graphics, and optimize images for web performance while ensuring legal compliance and brand consistency."
            },
            {
                name: "Frontend Specialist",
                slug: "frontend-specialist",
                roleDefinition: "You are a master UI/UX Designer & Frontend Developer specializing in creating intuitive user interfaces and exceptional user experiences. You implement responsive designs, ensure accessibility compliance, conduct user testing, and optimize frontend performance across all devices and platforms."
            }
        ];

        for (const mode of defaultModes) {
            this.customModes.set(mode.slug, mode);
        }
        await this.saveCustomModes();
    }
}