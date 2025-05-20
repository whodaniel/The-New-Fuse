import * as vscode from 'vscode';

export enum AICoderRole {
    Developer = 'developer',
    Reviewer = 'reviewer',
    Architect = 'architect',
    QA = 'qa'
}

export interface AICoderContext {
    fileUri?: vscode.Uri;
    selection?: vscode.Selection;
    workspaceFolder?: vscode.WorkspaceFolder;
    languageId?: string;
    metadata?: Record<string, any>;
}

export interface AICoderRequest {
    role: AICoderRole;
    task: string;
    context?: AICoderContext;
}

export interface AICoderResult {
    response: string;
    suggestions?: Array<{
        text: string;
        range?: vscode.Range;
    }>;
    metadata?: Record<string, any>;
}

export interface AICoderAnalysisContext extends AICoderContext {
    lastAnalysis?: {
        timestamp: number;
        findings: Array<{
            severity: 'info' | 'warning' | 'error';
            message: string;
            location?: vscode.Range;
        }>;
    };
}