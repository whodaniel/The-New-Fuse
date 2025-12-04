import { detectLanguage, highlightCode } from './highlight';
export function parseCodeBlock(block, options) {
    if (options === void 0) { options = {}; }
    var _a = options.detectFromContent, detectFromContent = _a === void 0 ? true : _a, _b = options.highlightCode, shouldHighlight = _b === void 0 ? true : _b;
    // Remove triple backticks and get language if specified
    var match = block.match(/^```(\w*)\n([\s\S]*?)```$/);
    if (!match) {
        return {
            language: '',
            code: block,
            highlighted: shouldHighlight ? highlightCode(block) : block
        };
    }
    var language = match[1], code = match[2];
    code = code.trim();
    // Detect language if not specified and detection is enabled
    if (!language && detectFromContent) {
        language = detectLanguage(code);
    }
    return {
        language: language,
        code: code,
        highlighted: shouldHighlight ? highlightCode(code, { language: language }) : code
    };
}
export function extractCodeBlocks(content) {
    var codeBlockRegex = /```[\s\S]*?```/g;
    var matches = content.match(codeBlockRegex);
    if (!matches)
        return [];
    return matches.map(function (block) { return parseCodeBlock(block); });
}
export function wrapInCodeBlock(code, language) {
    if (language === void 0) { language = ''; }
    return "```".concat(language, "\n").concat(code, "\n```");
}
export function isCodeBlock(text) {
    return /^```[\s\S]*?```$/.test(text.trim());
}
export function getLanguageLabel(language) {
    var languageLabels = {
        js: 'JavaScript',
        javascript: 'JavaScript',
        ts: 'TypeScript',
        typescript: 'TypeScript',
        jsx: 'React JSX',
        tsx: 'React TSX',
        py: 'Python',
        python: 'Python',
        rb: 'Ruby',
        java: 'Java',
        cpp: 'C++',
        cs: 'C#',
        php: 'PHP',
        go: 'Go',
        rust: 'Rust',
        swift: 'Swift',
        kotlin: 'Kotlin',
        sql: 'SQL',
        html: 'HTML',
        css: 'CSS',
        shell: 'Shell',
        bash: 'Bash',
        yaml: 'YAML',
        json: 'JSON',
        xml: 'XML',
        markdown: 'Markdown',
        md: 'Markdown'
    };
    return languageLabels[language.toLowerCase()] || language;
}
