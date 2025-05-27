"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
exports.getCodeAnalyzer = getCodeAnalyzer;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Tree-sitter is typically imported dynamically since it uses WebAssembly
let Parser;
let JavaScript;
let TypeScript;
let Python;
let initPromise = null;
/**
 * CodeAnalyzer uses tree-sitter for parsing and analyzing code
 * This provides a more robust syntax-aware code understanding similar to Copilot
 */
class CodeAnalyzer {
    constructor() {
        this.parsers = new Map();
        this.languageWasm = new Map();
        this.initialized = false;
    }
    /**
     * Initialize the code analyzer
     */
    async initialize() {
        if (initPromise)
            return initPromise;
        initPromise = this.initializeTreeSitter();
        return initPromise;
    }
    /**
     * Initialize tree-sitter and load language parsers
     */
    async initializeTreeSitter() {
        try {
            // Dynamically import tree-sitter
            const TreeSitter = await Promise.resolve().then(() => __importStar(require('web-tree-sitter')));
            await TreeSitter.init();
            Parser = TreeSitter;
            this.parser = new Parser();
            // Load language definitions from extension directory
            const extensionPath = vscode.extensions.getExtension('danielgoldberg.the-new-fuse')?.extensionPath;
            if (!extensionPath) {
                throw new Error('Extension path not found');
            }
            // Create and load parsers for each supported language
            await this.loadLanguageParser('javascript', path.join(extensionPath, 'parsers', 'tree-sitter-javascript.wasm'));
            await this.loadLanguageParser('typescript', path.join(extensionPath, 'parsers', 'tree-sitter-typescript.wasm'));
            await this.loadLanguageParser('python', path.join(extensionPath, 'parsers', 'tree-sitter-python.wasm'));
            this.initialized = true;
        }
        catch (error) {
            console.error('Failed to initialize Tree-sitter:', error);
            throw new Error(`Tree-sitter initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Load a language parser
     */
    async loadLanguageParser(language, wasmPath) {
        try {
            if (!fs.existsSync(wasmPath)) {
                console.warn(`WASM file not found: ${wasmPath}`);
                return;
            }
            const langWasm = await Parser.Language.load(wasmPath);
            this.languageWasm.set(language, langWasm);
            const parser = new Parser();
            parser.setLanguage(langWasm);
            this.parsers.set(language, parser);
            console.log(`Loaded ${language} parser`);
        }
        catch (error) {
            console.error(`Failed to load ${language} parser:`, error);
        }
    }
    /**
     * Get the language ID for a file
     */
    getLanguageForFile(uri) {
        const extension = path.extname(uri.fsPath).toLowerCase();
        switch (extension) {
            case '.js':
                return 'javascript';
            case '.jsx':
                return 'javascript';
            case '.ts':
                return 'typescript';
            case '.tsx':
                return 'typescript';
            case '.py':
                return 'python';
            default:
                return undefined;
        }
    }
    /**
     * Parse text and get the syntax tree
     */
    parseText(text, language) {
        if (!this.initialized) {
            throw new Error('CodeAnalyzer not initialized');
        }
        const parser = this.parsers.get(language);
        if (!parser) {
            throw new Error(`No parser available for language: ${language}`);
        }
        return parser.parse(text);
    }
    /**
     * Get abstract syntax tree for a document
     */
    async getASTForDocument(document) {
        await this.initialize();
        const language = this.getLanguageForFile(document.uri);
        if (!language) {
            throw new Error(`Unsupported language for file: ${document.uri.fsPath}`);
        }
        return this.parseText(document.getText(), language);
    }
    /**
     * Get functions defined in a document
     * This provides code structure understanding similar to Copilot
     */
    async getFunctions(document) {
        const tree = await this.getASTForDocument(document);
        if (!tree)
            return [];
        const language = this.getLanguageForFile(document.uri);
        if (!language)
            return [];
        const functions = [];
        const cursor = tree.walk();
        let nodeType = cursor.nodeType;
        // Collect functions based on language-specific node types
        const visitNode = () => {
            const node = cursor.currentNode();
            if (language === 'javascript' || language === 'typescript') {
                if (node.type === 'function_declaration' ||
                    node.type === 'method_definition' ||
                    node.type === 'arrow_function' ||
                    node.type === 'function') {
                    // Extract function details
                    functions.push({
                        type: node.type,
                        name: this.getFunctionName(node, document),
                        range: new vscode.Range(document.positionAt(node.startIndex), document.positionAt(node.endIndex)),
                        params: this.getParams(node, document),
                        body: document.getText(new vscode.Range(document.positionAt(node.startIndex), document.positionAt(node.endIndex)))
                    });
                }
            }
            else if (language === 'python') {
                if (node.type === 'function_definition') {
                    // Extract function details for Python
                    functions.push({
                        type: node.type,
                        name: this.getFunctionName(node, document),
                        range: new vscode.Range(document.positionAt(node.startIndex), document.positionAt(node.endIndex)),
                        params: this.getParams(node, document),
                        body: document.getText(new vscode.Range(document.positionAt(node.startIndex), document.positionAt(node.endIndex)))
                    });
                }
            }
            // Continue traversing the tree
            if (cursor.gotoFirstChild()) {
                do {
                    visitNode();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        visitNode();
        return functions;
    }
    /**
     * Get the name of a function from its node
     */
    getFunctionName(node, document) {
        try {
            // This is a simplified implementation
            // In a real version, this would be more robust based on language
            if (node.type === 'function_declaration' || node.type === 'method_definition') {
                // Find the identifier node
                for (let i = 0; i < node.namedChildCount; i++) {
                    const child = node.namedChild(i);
                    if (child.type === 'identifier') {
                        return document.getText(new vscode.Range(document.positionAt(child.startIndex), document.positionAt(child.endIndex)));
                    }
                }
            }
            return 'anonymous';
        }
        catch (error) {
            console.error('Error getting function name:', error);
            return 'unknown';
        }
    }
    /**
     * Get the parameters of a function from its node
     */
    getParams(node, document) {
        try {
            // Find the formal parameters node
            for (let i = 0; i < node.namedChildCount; i++) {
                const child = node.namedChild(i);
                if (child.type === 'formal_parameters' ||
                    child.type === 'parameter_list') {
                    const params = [];
                    // Extract each parameter
                    for (let j = 0; j < child.namedChildCount; j++) {
                        const param = child.namedChild(j);
                        params.push(document.getText(new vscode.Range(document.positionAt(param.startIndex), document.positionAt(param.endIndex))));
                    }
                    return params;
                }
            }
            return [];
        }
        catch (error) {
            console.error('Error getting function parameters:', error);
            return [];
        }
    }
    /**
     * Analyze a document to extract context for LLM prompting
     * This helps create better context for AI suggestions, similar to Copilot
     */
    async analyzeDocument(document) {
        await this.initialize();
        const functions = await this.getFunctions(document);
        // Get imports
        const tree = await this.getASTForDocument(document);
        const imports = this.getImports(tree, document);
        // Get classes
        const classes = this.getClasses(tree, document);
        // Prepare a context object with the document structure
        return {
            uri: document.uri.toString(),
            languageId: document.languageId,
            fileName: path.basename(document.uri.fsPath),
            functions,
            imports,
            classes,
            summary: this.generateDocumentSummary(document, functions, imports, classes)
        };
    }
    /**
     * Get imports from a document
     */
    getImports(tree, document) {
        try {
            const imports = [];
            const cursor = tree.walk();
            const visitNode = () => {
                const node = cursor.currentNode();
                if (node.type === 'import_statement' ||
                    node.type === 'import_declaration' ||
                    node.type === 'import_from_statement') {
                    imports.push({
                        type: node.type,
                        text: document.getText(new vscode.Range(document.positionAt(node.startIndex), document.positionAt(node.endIndex)))
                    });
                }
                if (cursor.gotoFirstChild()) {
                    do {
                        visitNode();
                    } while (cursor.gotoNextSibling());
                    cursor.gotoParent();
                }
            };
            visitNode();
            return imports;
        }
        catch (error) {
            console.error('Error getting imports:', error);
            return [];
        }
    }
    /**
     * Get classes from a document
     */
    getClasses(tree, document) {
        try {
            const classes = [];
            const cursor = tree.walk();
            const visitNode = () => {
                const node = cursor.currentNode();
                if (node.type === 'class_declaration' ||
                    node.type === 'class_definition') {
                    // Get class name
                    let className = 'Unknown';
                    for (let i = 0; i < node.namedChildCount; i++) {
                        const child = node.namedChild(i);
                        if (child.type === 'identifier') {
                            className = document.getText(new vscode.Range(document.positionAt(child.startIndex), document.positionAt(child.endIndex)));
                            break;
                        }
                    }
                    classes.push({
                        type: node.type,
                        name: className,
                        text: document.getText(new vscode.Range(document.positionAt(node.startIndex), document.positionAt(node.endIndex)))
                    });
                }
                if (cursor.gotoFirstChild()) {
                    do {
                        visitNode();
                    } while (cursor.gotoNextSibling());
                    cursor.gotoParent();
                }
            };
            visitNode();
            return classes;
        }
        catch (error) {
            console.error('Error getting classes:', error);
            return [];
        }
    }
    /**
     * Generate a summary of the document
     */
    generateDocumentSummary(document, functions, imports, classes) {
        const summary = [
            `File: ${path.basename(document.uri.fsPath)}`,
            `Language: ${document.languageId}`,
            `Length: ${document.getText().length} characters`,
            `Functions: ${functions.length}`,
            `Imports: ${imports.length}`,
            `Classes: ${classes.length}`,
            '',
            'Structure:',
            '----------'
        ];
        // Add imports
        if (imports.length > 0) {
            summary.push('Imports:');
            imports.forEach(imp => {
                summary.push(`- ${imp.text.replace(/\n/g, ' ').trim()}`);
            });
            summary.push('');
        }
        // Add classes
        if (classes.length > 0) {
            summary.push('Classes:');
            classes.forEach(cls => {
                summary.push(`- ${cls.name}`);
            });
            summary.push('');
        }
        // Add functions
        if (functions.length > 0) {
            summary.push('Functions:');
            functions.forEach(fn => {
                const params = fn.params.join(', ');
                summary.push(`- ${fn.name}(${params})`);
            });
        }
        return summary.join('\n');
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
// Create a singleton instance
let instance = null;
function getCodeAnalyzer() {
    if (!instance) {
        instance = new CodeAnalyzer();
    }
    return instance;
}
//# sourceMappingURL=code-analyzer.js.map