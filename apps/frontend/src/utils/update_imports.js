import fs from 'fs';
import path from 'path';
function updateImports(filename) {
    var content = fs.readFileSync(filename, 'utf8');
    var replacements = [
        ['from services.core.subscription_service', 'from services.core.subscription_service'],
        ['from services.core.marketplace_service', 'from services.core.marketplace_service'],
        ['from services.core.product_service', 'from services.core.product_service'],
        ['from services.ai.huggingface_service', 'from services.ai.huggingface_service'],
        ['from services.core.assistant_registration_service', 'from services.core.assistant_registration_service'],
        ['from services.core.user_service', 'from services.core.user_service']
    ];
    var updatedContent = content;
    for (var _i = 0, replacements_1 = replacements; _i < replacements_1.length; _i++) {
        var _a = replacements_1[_i], old = _a[0], newImport = _a[1];
        updatedContent = updatedContent.replace(new RegExp(old, 'g'), newImport);
    }
    fs.writeFileSync(filename, updatedContent);
}
function processDirectory(directory) {
    var files = fs.readdirSync(directory, { withFileTypes: true });
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var fullPath = path.join(directory, file.name);
        if (file.isDirectory()) {
            processDirectory(fullPath);
        }
        else if (file.name.endsWith('.ts')) {
            updateImports(fullPath);
        }
    }
}
if (require.main === module) {
    var baseDir = __dirname;
    processDirectory(baseDir);
}
