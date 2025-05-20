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
exports.CodeIndexer = void 0;
const vscode = __importStar(require("vscode"));
class CodeIndexer {
    constructor() {
        this.index = new Map();
    }
    async indexWorkspace() {
        try {
            const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**');
            for (const file of files) {
                const content = await vscode.workspace.fs.readFile(file);
                const text = new TextDecoder().decode(content);
                this.indexFile(file.fsPath, text);
            }
        }
        catch (error) {
            throw new Error(`Failed to index workspace: ${error.message}`);
        }
    }
    indexFile(path, content) {
        const terms = this.extractTerms(content);
        this.index.set(path, terms);
    }
    extractTerms(content) {
        // Basic term extraction - can be enhanced based on needs
        return content
            .split(/\W+/)
            .filter(term => term.length > 2)
            .map(term => term.toLowerCase());
    }
    search(query) {
        const searchTerms = query.toLowerCase().split(/\W+/);
        const results = new Map();
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
exports.CodeIndexer = CodeIndexer;
//# sourceMappingURL=CodeIndexer.js.map