import * as vscode from 'vscode';

export class ConfigurationService {
    constructor(private context: vscode.ExtensionContext) {}

    get<T>(key: string, defaultValue?: T): T {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return config.get<T>(key, defaultValue as T);
    }

    async update(key: string, value: any, target = vscode.ConfigurationTarget.Global): Promise<void> {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        await config.update(key, value, target);
    }

    onConfigurationChanged(callback: () => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('theNewFuse')) {
                callback();
            }
        });
    }
}