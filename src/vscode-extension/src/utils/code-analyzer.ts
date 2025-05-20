import * as vscode from 'vscode';
import * as path from 'path';
import { getLogger, Logger } from '../core/logging.js';
import { getErrorMessage } from '../utils/error-utils.js';

/**
 * Code analyzer for extracting semantic information from code
 * Based on techniques used in Copilot for context-aware analysis
 */
export interface CodeAnalyzer {
  initialize(): Promise<void>;
  analyzeDocument(document: vscode.TextDocument): Promise<CodeAnalysisResult>;
  analyzeSelection(document: vscode.TextDocument, selection: vscode.Selection): Promise<CodeAnalysisResult>;
  dispose(): void;
}

/**
 * Result of code analysis
 */
export interface CodeAnalysisResult {
  summary: string;
  codeBlocks: CodeBlock[];
  symbols: CodeSymbol[];
  dependencies?: string[];
  imports?: string[];
  recommendations?: string[];
}

/**
 * Code block with semantic information
 */
export interface CodeBlock {
  type: 'function' | 'class' | 'method' | 'property' | 'variable' | 'import' | 'export' | 'other';
  name: string;
  range: vscode.Range;
  content: string;
  children?: CodeBlock[];
}

/**
 * Symbol information extracted from code
 */
export interface CodeSymbol {
  name: string;
  type: 'function' | 'class' | 'method' | 'property' | 'variable' | 'import' | 'export' | 'other';
  location: vscode.Location;
  detail?: string;
}

/**
 * Implementation of the CodeAnalyzer interface
 * Uses a combination of VS Code's API and tree-sitter for analysis
 */
export class DefaultCodeAnalyzer implements CodeAnalyzer {
  private initialized: boolean = false;
  private logger: Logger;
  private parser: any | undefined;
  
  constructor() {
    this.logger = getLogger();
  }
  
  /**
   * Initialize the code analyzer
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // For now, we'll use VS Code's Symbol Provider API instead of tree-sitter
      // Tree-sitter would be loaded and initialized here in a full implementation
      this.initialized = true;
      this.logger.info('Code analyzer initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize code analyzer: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  
  /**
   * Analyze a text document to extract semantic information
   */
  public async analyzeDocument(document: vscode.TextDocument): Promise<CodeAnalysisResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get document symbols using VS Code's Symbol Provider API
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      ) || [];
      
      // Get imports and dependencies
      const imports = this.extractImports(document);
      
      // Convert symbols to our CodeBlock format
      const codeBlocks = this.convertToCodeBlocks(symbols, document);
      
      // Convert symbols to our CodeSymbol format
      const codeSymbols = this.convertToCodeSymbols(symbols, document);
      
      // Generate a summary
      const summary = this.generateSummary(document, codeBlocks, imports);
      
      return {
        summary,
        codeBlocks,
        symbols: codeSymbols,
        imports,
        dependencies: this.extractDependencies(document),
        recommendations: this.generateRecommendations(document, codeBlocks)
      };
    } catch (error) {
      this.logger.error(`Error analyzing document: ${getErrorMessage(error)}`);
      
      // Return a minimal result in case of error
      return {
        summary: `Failed to fully analyze ${path.basename(document.fileName)}: ${getErrorMessage(error)}`,
        codeBlocks: [],
        symbols: []
      };
    }
  }
  
  /**
   * Analyze a specific selection within a document
   */
  public async analyzeSelection(
    document: vscode.TextDocument, 
    selection: vscode.Selection
  ): Promise<CodeAnalysisResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get full document symbols
      const allSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      ) || [];
      
      // Filter symbols that overlap with the selection
      const selectedSymbols = this.filterSymbolsBySelection(allSymbols, selection);
      
      // Get the selected text
      const selectedText = document.getText(selection);
      
      // Convert symbols to our CodeBlock format
      const codeBlocks = this.convertToCodeBlocks(selectedSymbols, document);
      
      // Convert symbols to our CodeSymbol format
      const codeSymbols = this.convertToCodeSymbols(selectedSymbols, document);
      
      // Generate a summary focused on the selection
      const summary = this.generateSelectionSummary(document, selection, selectedText, codeBlocks);
      
      return {
        summary,
        codeBlocks,
        symbols: codeSymbols
      };
    } catch (error) {
      this.logger.error(`Error analyzing selection: ${getErrorMessage(error)}`);
      
      // Return a minimal result in case of error
      return {
        summary: `Failed to analyze selection: ${getErrorMessage(error)}`,
        codeBlocks: [],
        symbols: []
      };
    }
  }
  
  /**
   * Filter symbols by a selection range
   */
  private filterSymbolsBySelection(
    symbols: vscode.DocumentSymbol[],
    selection: vscode.Selection
  ): vscode.DocumentSymbol[] {
    const result: vscode.DocumentSymbol[] = [];
    
    for (const symbol of symbols) {
      const range = symbol.range;
      
      // Check if the symbol overlaps with the selection
      if (range.intersection(selection)) {
        result.push(symbol);
      } else if (symbol.children && symbol.children.length > 0) {
        // Check children recursively
        const children = this.filterSymbolsBySelection(symbol.children, selection);
        if (children.length > 0) {
          // Create a new symbol with only the overlapping children
          result.push({
            ...symbol,
            children
          });
        }
      }
    }
    
    return result;
  }
  
  /**
   * Extract imports from a document
   */
  private extractImports(document: vscode.TextDocument): string[] {
    const imports: string[] = [];
    const text = document.getText();
    
    // This is a simplified version - a real implementation would use
    // language-specific parsing for accurate results
    const importRegexes = {
      // TypeScript/JavaScript
      ts: [
        /import\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g,
        /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        /import\s+['"]([^'"]+)['"]/g,
        /require\(['"]([^'"]+)['"]\)/g
      ],
      // Python
      python: [
        /import\s+(.+?)(?:\s+as\s+.+)?$/gm,
        /from\s+(.+?)\s+import\s+.+$/gm
      ],
      // Java
      java: [
        /import\s+(.+?);/g
      ],
      // C#
      csharp: [
        /using\s+(.+?);/g
      ]
    };
    
    let language = document.languageId;
    
    // Map language ID to one of our supported types
    if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(language)) {
      language = 'ts';
    } else if (['python'].includes(language)) {
      language = 'python';
    } else if (['java'].includes(language)) {
      language = 'java';
    } else if (['csharp'].includes(language)) {
      language = 'csharp';
    } else {
      // Default to TypeScript regexes for unknown languages
      language = 'ts';
    }
    
    const regexes = importRegexes[language as keyof typeof importRegexes] || [];
    
    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        // The import statement is usually in the last capturing group
        const importPath = match[match.length - 1].trim();
        if (importPath && !imports.includes(importPath)) {
          imports.push(importPath);
        }
      }
    }
    
    return imports;
  }
  
  /**
   * Extract dependencies from a document based on imports
   */
  private extractDependencies(document: vscode.TextDocument): string[] {
    const imports = this.extractImports(document);
    const dependencies: string[] = [];
    
    for (const imp of imports) {
      // Extract the root package from the import
      let dependency = imp;
      
      // If it's a path, extract the first segment which is likely the package name
      if (imp.includes('/')) {
        dependency = imp.split('/')[0];
      }
      
      // Skip relative imports (starting with .)
      if (!dependency.startsWith('.') && !dependencies.includes(dependency)) {
        dependencies.push(dependency);
      }
    }
    
    return dependencies;
  }
  
  /**
   * Get references to symbols in the document
   */
  private async getReferences(_document: vscode.TextDocument): Promise<vscode.Location[]> {
    // This would be a heavier operation in a real implementation
    // For now, we'll return an empty array to avoid performance issues
    return [];
  }
  
  /**
   * Convert VS Code's DocumentSymbols to our CodeBlock format
   */
  private convertToCodeBlocks(
    symbols: vscode.DocumentSymbol[],
    document: vscode.TextDocument
  ): CodeBlock[] {
    return symbols.map(symbol => this.symbolToCodeBlock(symbol, document));
  }
  
  /**
   * Convert a single DocumentSymbol to a CodeBlock
   */
  private symbolToCodeBlock(
    symbol: vscode.DocumentSymbol,
    document: vscode.TextDocument
  ): CodeBlock {
    const content = document.getText(symbol.range);
    
    const type = this.symbolKindToBlockType(symbol.kind);
    
    const block: CodeBlock = {
      type,
      name: symbol.name,
      range: symbol.range,
      content
    };
    
    if (symbol.children && symbol.children.length > 0) {
      block.children = symbol.children.map(child => 
        this.symbolToCodeBlock(child, document)
      );
    }
    
    return block;
  }
  
  /**
   * Convert VS Code's SymbolKind to our CodeBlock type
   */
  private symbolKindToBlockType(kind: vscode.SymbolKind): CodeBlock['type'] {
    switch (kind) {
      case vscode.SymbolKind.Function:
      case vscode.SymbolKind.Constructor:
        return 'function';
      case vscode.SymbolKind.Class:
      case vscode.SymbolKind.Interface:
      case vscode.SymbolKind.Struct:
        return 'class';
      case vscode.SymbolKind.Method:
        return 'method';
      case vscode.SymbolKind.Property:
      case vscode.SymbolKind.Field:
        return 'property';
      case vscode.SymbolKind.Variable:
      case vscode.SymbolKind.Constant:
        return 'variable';
      case vscode.SymbolKind.Module:
      case vscode.SymbolKind.Package:
        return 'import';
      case vscode.SymbolKind.Namespace:
      case vscode.SymbolKind.Event:
      case vscode.SymbolKind.Enum:
      default:
        return 'other';
    }
  }
  
  /**
   * Convert DocumentSymbols to CodeSymbols
   */
  private convertToCodeSymbols(
    symbols: vscode.DocumentSymbol[],
    document: vscode.TextDocument
  ): CodeSymbol[] {
    const result: CodeSymbol[] = [];
    
    const processSymbol = (symbol: vscode.DocumentSymbol) => {
      result.push({
        name: symbol.name,
        type: this.symbolKindToBlockType(symbol.kind),
        location: new vscode.Location(document.uri, symbol.range),
        detail: symbol.detail
      });
      
      if (symbol.children) {
        symbol.children.forEach(processSymbol);
      }
    };
    
    symbols.forEach(processSymbol);
    
    return result;
  }
  
  /**
   * Generate a summary of the document based on analysis
   */
  private generateSummary(
    document: vscode.TextDocument,
    codeBlocks: CodeBlock[],
    imports: string[]
  ): string {
    const fileName = path.basename(document.fileName);
    
    // Group code blocks by type
    const functions = codeBlocks.filter(block => block.type === 'function');
    const classes = codeBlocks.filter(block => block.type === 'class');
    const variables = codeBlocks.filter(block => block.type === 'variable');
    
    // Build the summary
    let summary = `File: ${fileName}\n`;
    summary += `Language: ${document.languageId}\n`;
    
    if (imports.length > 0) {
      summary += `\nImports: ${imports.join(', ')}\n`;
    }
    
    if (classes.length > 0) {
      summary += `\nClasses (${classes.length}): ${classes.map(c => c.name).join(', ')}\n`;
    }
    
    if (functions.length > 0) {
      summary += `\nFunctions (${functions.length}): ${functions.map(f => f.name).join(', ')}\n`;
    }
    
    if (variables.length > 0) {
      const topLevelVars = variables.filter(v => !v.name.startsWith('_'));
      if (topLevelVars.length > 0) {
        summary += `\nTop-level variables: ${topLevelVars.map(v => v.name).join(', ')}\n`;
      }
    }
    
    return summary;
  }
  
  /**
   * Generate a summary focused on a selection
   */
  private generateSelectionSummary(
    document: vscode.TextDocument,
    selection: vscode.Selection,
    selectedText: string,
    codeBlocks: CodeBlock[]
  ): string {
    const fileName = path.basename(document.fileName);
    
    // Build the summary
    let summary = `File: ${fileName}\n`;
    summary += `Selection: Line ${selection.start.line + 1}:${selection.start.character + 1} to Line ${selection.end.line + 1}:${selection.end.character + 1}\n`;
    
    if (codeBlocks.length > 0) {
      summary += `\nSelected code blocks: ${codeBlocks.map(b => `${b.type} ${b.name}`).join(', ')}\n`;
    } else {
      // If no code blocks were identified, check what kind of text is selected
      let selectionType = 'text';
      if (selectedText.includes('{') && selectedText.includes('}')) {
        selectionType = 'code block';
      } else if (selectedText.trim().endsWith(';')) {
        selectionType = 'statement';
      } else if (selectedText.includes('=')) {
        selectionType = 'assignment';
      }
      
      summary += `\nSelected ${selectionType} (${selectedText.length} characters)\n`;
    }
    
    return summary;
  }
  
  /**
   * Generate recommendations based on code analysis
   */
  private generateRecommendations(
    document: vscode.TextDocument,
    codeBlocks: CodeBlock[]
  ): string[] {
    const recommendations: string[] = [];
    
    // A real implementation would have more sophisticated analysis
    // These are simple examples
    
    // Check for long functions
    const longFunctions = codeBlocks.filter(
      block => block.type === 'function' && 
      block.content.split('\n').length > 30
    );
    
    if (longFunctions.length > 0) {
      recommendations.push(
        `Consider refactoring long functions: ${longFunctions.map(f => f.name).join(', ')}`
      );
    }
    
    // Check for large classes
    const largeClasses = codeBlocks.filter(
      block => block.type === 'class' && 
      block.content.split('\n').length > 100
    );
    
    if (largeClasses.length > 0) {
      recommendations.push(
        `Consider breaking up large classes: ${largeClasses.map(c => c.name).join(', ')}`
      );
    }
    
    return recommendations;
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clean up any resources
    this.parser = undefined;
    this.initialized = false;
  }
}

// Singleton instance
let codeAnalyzerInstance: CodeAnalyzer | undefined;

/**
 * Get the code analyzer instance
 */
export function getCodeAnalyzer(): CodeAnalyzer {
  if (!codeAnalyzerInstance) {
    codeAnalyzerInstance = new DefaultCodeAnalyzer();
  }
  return codeAnalyzerInstance;
}
