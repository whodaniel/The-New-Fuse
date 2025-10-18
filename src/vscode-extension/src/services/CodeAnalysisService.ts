import * as vscode from 'vscode';
import { ApiClient } from './ApiClient';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface CodeAnalysisResult {
    filePath: string;
    language: string;
    complexity: number;
    issues: CodeIssue[];
    suggestions: CodeSuggestion[];
    metrics: CodeMetrics;
    taskId?: string;
}

export interface CodeIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column: number;
    severity: 'high' | 'medium' | 'low';
    rule: string;
}

export interface CodeSuggestion {
    type: 'refactor' | 'optimize' | 'security' | 'style';
    message: string;
    line: number;
    column: number;
    suggestion: string;
    confidence: number;
}

export interface CodeMetrics {
    linesOfCode: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    codeCoverage?: number;
    performanceScore?: number;
}

export class CodeAnalysisService {
    private apiClient: ApiClient;
    private configManager: ConfigurationManager;
    private analysisCache = new Map<string, { result: CodeAnalysisResult; timestamp: number }>();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    constructor(apiClient: ApiClient, configManager: ConfigurationManager) {
        this.apiClient = apiClient;
        this.configManager = configManager;
    }

    /**
     * Analyze a single file
     */
    async analyzeFile(filePath: string, content?: string): Promise<CodeAnalysisResult> {
        const cacheKey = `${filePath}:${content?.length || 0}`;

        // Check cache first
        const cached = this.analysisCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.result;
        }

        try {
            // Get file content if not provided
            if (!content) {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                content = document.getText();
            }

            // Get file language
            const language = this.getLanguageFromPath(filePath) || 'plaintext';

            // Create analysis task in backend
            const taskId = await this.createAnalysisTask(filePath, content, language);

            if (taskId) {
                // Get analysis results from backend
                const result = await this.getAnalysisResults(taskId);

                // Cache the result
                this.analysisCache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });

                return result;
            }

            throw new Error('Failed to create analysis task');
        } catch (error) {
            console.error('Error analyzing file:', error);
            throw error;
        }
    }

    /**
     * Analyze current workspace
     */
    async analyzeWorkspace(): Promise<CodeAnalysisResult[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace open');
        }

        const results: CodeAnalysisResult[] = [];

        for (const folder of workspaceFolders) {
            const files = await this.getCodeFilesInFolder(folder.uri.fsPath);
            for (const file of files) {
                try {
                    const result = await this.analyzeFile(file);
                    results.push(result);
                } catch (error) {
                    console.error(`Error analyzing ${file}:`, error);
                }
            }
        }

        return results;
    }

    /**
     * Get real-time analysis for current cursor position
     */
    async analyzeCurrentPosition(): Promise<CodeAnalysisResult | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const filePath = editor.document.fileName;
        const position = editor.selection.active;

        try {
            const result = await this.analyzeFile(filePath);

            // Filter issues and suggestions for current position
            const relevantIssues = result.issues.filter(issue =>
                issue.line === position.line + 1 // Convert to 1-based
            );

            const relevantSuggestions = result.suggestions.filter(suggestion =>
                suggestion.line === position.line + 1
            );

            return {
                ...result,
                issues: relevantIssues,
                suggestions: relevantSuggestions
            };
        } catch (error) {
            console.error('Error analyzing current position:', error);
            return null;
        }
    }

    /**
     * Get code quality score for file
     */
    async getCodeQualityScore(filePath: string): Promise<number> {
        try {
            const result = await this.analyzeFile(filePath);
            return this.calculateQualityScore(result);
        } catch (error) {
            console.error('Error calculating quality score:', error);
            return 0;
        }
    }

    /**
     * Clear analysis cache
     */
    clearCache(): void {
        this.analysisCache.clear();
    }

    private async createAnalysisTask(filePath: string, content: string, language: string): Promise<string | null> {
        try {
            const response = await this.apiClient.axiosInstance.post('/tasks/analysis', {
                filePath,
                content,
                language,
                analysisTypes: ['complexity', 'issues', 'suggestions', 'metrics'],
                workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            });

            return response.data.taskId;
        } catch (error) {
            console.error('Error creating analysis task:', error);
            return null;
        }
    }

    private async getAnalysisResults(taskId: string): Promise<CodeAnalysisResult> {
        try {
            const response = await this.apiClient.axiosInstance.get(`/tasks/${taskId}/analysis`);

            // Poll for results
            const maxPolls = 60; // 30 seconds max
            let polls = 0;

            while (polls < maxPolls) {
                if (response.data.result) {
                    return response.data.result;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
                polls++;
            }

            throw new Error('Analysis timeout');
        } catch (error) {
            console.error('Error getting analysis results:', error);
            throw error;
        }
    }

    private async getCodeFilesInFolder(folderPath: string): Promise<string[]> {
        const pattern = '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,c,go,rs,php,rb,swift,kt,scala,html,css}';
        const files = await vscode.workspace.findFiles(pattern);

        return files
            .map((file: vscode.Uri) => file.fsPath)
            .filter((file: string) => file.startsWith(folderPath));
    }

    private getLanguageFromPath(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'java': 'java',
            'cs': 'csharp',
            'cpp': 'cpp',
            'c': 'c',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css'
        };

        return languageMap[ext || ''] || 'plaintext';
    }

    public calculateQualityScore(result: CodeAnalysisResult): number {
        const { metrics, issues } = result;

        // Base score from maintainability index
        let score = Math.max(0, Math.min(100, metrics.maintainabilityIndex));

        // Penalize for issues
        const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
        const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;

        score -= (highSeverityIssues * 5) + (mediumSeverityIssues * 2);

        // Bonus for good metrics
        if (metrics.technicalDebt < 10) score += 5;
        if (metrics.performanceScore && metrics.performanceScore > 80) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get analysis for multiple files
     */
    async analyzeFiles(filePaths: string[]): Promise<CodeAnalysisResult[]> {
        const results: CodeAnalysisResult[] = [];

        for (const filePath of filePaths) {
            try {
                const result = await this.analyzeFile(filePath);
                results.push(result);
            } catch (error) {
                console.error(`Error analyzing ${filePath}:`, error);
            }
        }

        return results;
    }

    /**
     * Get analysis summary for workspace
     */
    async getWorkspaceAnalysisSummary(): Promise<{
        totalFiles: number;
        averageQuality: number;
        totalIssues: number;
        criticalIssues: number;
        languages: Record<string, number>;
    }> {
        const results = await this.analyzeWorkspace();

        const totalFiles = results.length;
        const averageQuality = results.reduce((sum, r) => sum + this.calculateQualityScore(r), 0) / totalFiles;
        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const criticalIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);

        const languages: Record<string, number> = {};
        results.forEach(result => {
            languages[result.language] = (languages[result.language] || 0) + 1;
        });

        return {
            totalFiles,
            averageQuality: Math.round(averageQuality * 100) / 100,
            totalIssues,
            criticalIssues,
            languages
        };
    }
}