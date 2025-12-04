import highlight from 'highlight';
import { getFileExtension } from '../directories';
export function highlightCode(code, options) {
    if (options === void 0) { options = {}; }
    var language = options.language, _a = options.ignoreIllegals, ignoreIllegals = _a === void 0 ? true : _a;
    if (!code)
        return '';
    try {
        if (language && highlight.getLanguage(language)) {
            return highlight.highlight(code, { language: language, ignoreIllegals: ignoreIllegals }).value;
        }
        return highlight.highlightAuto(code).value;
    }
    catch (_b) {
        return code;
    }
}
export function detectLanguage(code, filename) {
    // Try to detect from filename first
    if (filename) {
        var ext = getFileExtension(filename);
        if (ext && highlight.getLanguage(ext)) {
            return ext;
        }
        // Map common extensions to languages
        var extensionMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'rs': 'rust',
            'go': 'go',
            'java': 'java',
            'kt': 'kotlin',
            'php': 'php',
            'cs': 'csharp',
            'fs': 'fsharp',
            'sh': 'bash',
            'yml': 'yaml',
            'yaml': 'yaml',
        };
        if (ext && extensionMap[ext]) {
            return extensionMap[ext];
        }
    }
    // Try to detect from code content
    try {
        var result = highlight.highlightAuto(code);
        return result.language || '';
    }
    catch (_a) {
        return '';
    }
}
export function getLanguageIcon(language) {
    // Map languages to icon classes (using your icon system)
    var iconMap = {
        javascript: 'javascript',
        typescript: 'typescript',
        python: 'python',
        java: 'java',
        ruby: 'ruby',
        go: 'go',
        rust: 'rust',
        cpp: 'cpp',
        csharp: 'csharp',
        php: 'php',
        swift: 'swift',
        kotlin: 'kotlin',
        html: 'html',
        css: 'css',
        sql: 'database',
        bash: 'terminal',
        shell: 'terminal',
        yaml: 'file-code',
        json: 'brackets-curly',
        markdown: 'markdown',
    };
    return iconMap[language] || 'file-code';
}
export function registerCustomLanguages() {
    // Add any custom language definitions here if needed
    // Example:
    // highlight.registerLanguage('custom', customLanguageDefinition);
}
// Initialize any custom languages
registerCustomLanguages();
