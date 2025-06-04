import * as vscode from 'vscode';

/**
 * Service for managing data persistence using VS Code's Memento API.
 * Provides a centralized and abstracted way to store and retrieve data
 * from global and workspace states.
 */
export class StorageService {
    private globalState: vscode.Memento;
    private workspaceState: vscode.Memento;

    /**
     * Creates an instance of StorageService.
     * @param context - The VS Code extension context, used to access global and workspace state.
     */
    constructor(private context: vscode.ExtensionContext) {
        this.globalState = context.globalState;
        this.workspaceState = context.workspaceState;
    }

    /**
     * Stores a value in the global state.
     * @param key - The key under which to store the value.
     * @param value - The value to store.
     * @returns A promise that resolves when the value has been stored.
     */
    async storeGlobal<T>(key: string, value: T): Promise<void> {
        await this.globalState.update(key, value);
    }

    /**
     * Retrieves a value from the global state.
     * @param key - The key of the value to retrieve.
     * @param defaultValue - An optional default value to return if the key is not found.
     * @returns The retrieved value, or the defaultValue if provided and the key is not found, otherwise undefined.
     */
    getGlobal<T>(key: string, defaultValue?: T): T | undefined {
        return this.globalState.get<T>(key, defaultValue);
    }

    /**
     * Removes a value from the global state.
     * @param key - The key of the value to remove.
     * @returns A promise that resolves when the value has been removed.
     */
    async removeFromGlobal(key: string): Promise<void> {
        await this.globalState.update(key, undefined);
    }

    /**
     * Stores a value in the workspace state.
     * @param key - The key under which to store the value.
     * @param value - The value to store.
     * @returns A promise that resolves when the value has been stored.
     */
    async storeWorkspace<T>(key: string, value: T): Promise<void> {
        await this.workspaceState.update(key, value);
    }

    /**
     * Retrieves a value from the workspace state.
     * @param key - The key of the value to retrieve.
     * @param defaultValue - An optional default value to return if the key is not found.
     * @returns The retrieved value, or the defaultValue if provided and the key is not found, otherwise undefined.
     */
    getWorkspace<T>(key: string, defaultValue?: T): T | undefined {
        return this.workspaceState.get<T>(key, defaultValue);
    }

    /**
     * Removes a value from the workspace state.
     * @param key - The key of the value to remove.
     * @returns A promise that resolves when the value has been removed.
     */
    async removeFromWorkspace(key: string): Promise<void> {
        await this.workspaceState.update(key, undefined);
    }
}