import * as vscode from 'vscode';
export class LLMMonitoringService {
    constructor(private context: vscode.ExtensionContext) {}
    public logInteraction(interaction: any): void { console.log('LLM Interaction:', interaction); }
    public getRecentInteractions(count: number): any[] { return []; }
    public dispose(): void {}
}
