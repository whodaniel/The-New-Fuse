import * as vscode from 'vscode';

/**
 * Provides a centralized way to access and manage extension settings.
 */
export class ConfigurationService {
    private static readonly CONFIGURATION_SCOPE = 'theNewFuse';

    /**
     * Gets a specific configuration value.
     * @param key The configuration key.
     * @param defaultValue The default value if the key is not found.
     * @returns The configuration value.
     */
    public get<T>(key: string, defaultValue?: T): T | undefined {
        const configuration = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SCOPE);
        return configuration.get<T>(key, defaultValue);
    }

    /**
     * Updates a configuration value.
     * @param key The configuration key to update.
     * @param value The new value.
     * @param target The configuration target (Global or Workspace).
     * @returns A promise that resolves when the configuration has been updated.
     */
    public async update(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
        const configuration = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SCOPE);
        await configuration.update(key, value, target);
    }
}