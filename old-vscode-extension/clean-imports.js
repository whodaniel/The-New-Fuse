const ts = require('typescript');
const fs = require('fs');
const path = require('path');

function cleanImports(filePath) {
    const program = ts.createProgram([filePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React
    });

    const sourceFile = program.getSourceFile(filePath);
    const typeChecker = program.getTypeChecker();

    const importSpecifiers = new Set();
    const usedIdentifiers = new Set();

    // Collect all import specifiers
    ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {
            node.importClause?.namedBindings?.forEachChild(binding => {
                if (ts.isImportSpecifier(binding)) {
                    importSpecifiers.add(binding.name.text);
                }
            });
        }
    });

    // Collect all used identifiers
    ts.forEachChild(sourceFile, function visit(node) {
        if (ts.isIdentifier(node)) {
            const symbol = typeChecker.getSymbolAtLocation(node);
            if (symbol) {
                usedIdentifiers.add(node.text);
            }
        }
        ts.forEachChild(node, visit);
    });

    // Remove unused imports
    const unusedImports = Array.from(importSpecifiers).filter(specifier => 
        !usedIdentifiers.has(specifier)
    );

    if (unusedImports.length > 0) {
        console.log(`Found unused imports in ${path.basename(filePath)}:`, unusedImports);
        
        const sourceText = sourceFile.getFullText();
        let result = sourceText;

        // Remove unused import specifiers
        unusedImports.forEach(unusedImport => {
            const regex = new RegExp(`\\s*${unusedImport}\\s*,?`);
            result = result.replace(regex, '');
        });

        // Clean up empty imports
        result = result.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\n?/g, '');

        fs.writeFileSync(filePath, result);
        console.log(`Cleaned up imports in ${path.basename(filePath)}`);
    }
}

// Process all TypeScript files in the src directory
function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            cleanImports(fullPath);
        }
    });
}

// Start processing from the src directory
const srcDir = path.join(__dirname, 'src');
processDirectory(srcDir);