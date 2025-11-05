#!/usr/bin/env node
declare class ClaudeDevCLI {
    private config;
    private spinner;
    constructor();
    private loadConfig;
    private saveConfig;
    private makeRequest;
    private displayAutomationResult;
    listTemplates(category?: string): Promise<void>;
    getTemplate(templateId: string): Promise<void>;
}
export default ClaudeDevCLI;
//# sourceMappingURL=claude-dev-cli.d.ts.map