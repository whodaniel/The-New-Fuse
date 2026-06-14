export type SlashCommandSource = 'standard' | 'tnf' | 'project';
export type SlashCommandMode = 'control' | 'prompt' | 'cli' | 'info';
export interface SlashCommandDefinition {
    name: string;
    aliases?: string[];
    summary: string;
    usage: string;
    source: SlashCommandSource;
    mode: SlashCommandMode;
    prompt?: string;
    cliCommand?: string[];
    content?: string;
    filePath?: string;
}
export interface ParsedSlashCommand {
    rawName: string;
    name: string;
    args: string[];
}
export declare function parseSlashCommand(input: string): ParsedSlashCommand | null;
export declare function normalizeSlashName(name: string): string;
export declare function getStandardSlashCommands(): SlashCommandDefinition[];
export declare function getProjectSlashCommands(projectRoot: string): SlashCommandDefinition[];
export declare function getAllSlashCommands(projectRoot: string): SlashCommandDefinition[];
export declare function findSlashCommand(name: string, projectRoot: string): SlashCommandDefinition | null;
export declare function renderSlashCommandList(projectRoot: string): string;
export declare function renderSlashCommandDetail(command: SlashCommandDefinition): string;
export declare function formatPromptSlashCommand(command: SlashCommandDefinition, args: string[]): string;
//# sourceMappingURL=slashCommands.d.ts.map