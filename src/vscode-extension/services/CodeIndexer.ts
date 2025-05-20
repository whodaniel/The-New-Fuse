import * as vscode from 'vscode';

export class CodeIndexer {
    private index: Map<string, string[]> = new Map();

    constructor() {}

    async indexWorkspace(): Promise<void> {
        try {
            const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**');
            for (const file of files) {
                const content = await vscode.workspace.fs.readFile(file);
                const text = new TextDecoder().decode(content);
                this.indexFile(file.fsPath, text);
            }
        } catch (error) {
            throw new Error(`Failed to index workspace: ${(error as Error).message}`);
        }
    }

    private indexFile(path: string, content: string): void {
        const terms = this.extractTerms(content);
        this.index.set(path, terms);
    }

    private extractTerms(content: string): string[] {
        // Basic term extraction - can be enhanced based on needs
        return content
            .split(/\W+/)
            .filter(term => term.length > 2)
            .map(term => term.toLowerCase());
    }

    search(query: string): string[] {
        const searchTerms = query.toLowerCase().split(/\W+/);
        const results = new Map<string, number>();

        for (const [path, terms] of this.index) {
            const matches = searchTerms.filter(term => terms.includes(term)).length;
            if (matches > 0) {
                results.set(path, matches);
            }
        }

        return Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([path]) => path);
    }
}