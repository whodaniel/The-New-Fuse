import * as vscode from 'vscode';

export interface AICoder {
    suggestCode(context: CodeContext): Promise<CodeSuggestion>;
    explainCode(code: string): Promise<string>;
    refactorCode(code: string, instructions: string): Promise<CodeRefactoring>;
    reviewCode(code: string): Promise<CodeReview>;
}

export interface CodeContext {
    code: string;
    language: string;
    file?: string;
    selection?: vscode.Selection;
    workspace?: vscode.WorkspaceFolder;
}

export interface CodeSuggestion {
    code: string;
    explanation: string;
    confidence: number;
}

export interface CodeRefactoring {
    originalCode: string;
    refactoredCode: string;
    changes: string[];
    explanation: string;
}

export interface CodeReview {
    issues: CodeIssue[];
    suggestions: string[];
    score: number;
}

export interface CodeIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
    severity: number;
}
