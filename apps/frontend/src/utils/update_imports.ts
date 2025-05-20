export {}
import fs from 'fs';
import path from 'path';
function updateImports(filename): any {
    const content = fs.readFileSync(filename, 'utf8');
    const replacements = [
        ['from services.core.subscription_service', 'from services.core.subscription_service'],
        ['from services.core.marketplace_service', 'from services.core.marketplace_service'],
        ['from services.core.product_service', 'from services.core.product_service'],
        ['from services.ai.huggingface_service', 'from services.ai.huggingface_service'],
        ['from services.core.assistant_registration_service', 'from services.core.assistant_registration_service'],
        ['from services.core.user_service', 'from services.core.user_service']
    ];
    let updatedContent = content;
    for (const [old, newImport] of replacements) {
        updatedContent = updatedContent.replace(new RegExp(old, 'g'), newImport);
    }
    fs.writeFileSync(filename, updatedContent);
}
function processDirectory(directory): any {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        if (file.isDirectory()) {
            processDirectory(fullPath);
        }
        else if (file.name.endsWith('.ts')) {
            updateImports(fullPath);
        }
    }
}
if (require.main === module) {
    const baseDir = __dirname;
    processDirectory(baseDir);
    
}
export {};
//# sourceMappingURL=update_imports.js.map