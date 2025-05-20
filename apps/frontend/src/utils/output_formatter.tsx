export {}
exports.OutputFormatter = exports.OutputFormat = void 0;
var OutputFormat;
(function (OutputFormat): any {
    OutputFormat["JSON"] = "json";
    OutputFormat["TEXT"] = "text";
    OutputFormat["MARKDOWN"] = "markdown";
    OutputFormat["HTML"] = "html";
})(OutputFormat || (exports.OutputFormat = OutputFormat = {}));
class OutputFormatter {
    constructor(default_schema) {
        this.default_schema = default_schema || {
            format: OutputFormat.JSON,
            indent: 2,
            include_metadata: true,
            escape_html: true,
            pretty_print: true
        };
    }
    format(content, schema) {
        const activeSchema = schema || this.default_schema;
        let formattedContent;
        let metadata;
        switch (activeSchema.format) {
            case OutputFormat.JSON:
                if (typeof content === 'string') {
                    try {
                        content = JSON.parse(content);
                    }
                    catch (_a) {
                        content = { text: content };
                    }
                }
                formattedContent = JSON.stringify(content, null, activeSchema.pretty_print ? activeSchema.indent : 0);
                if (activeSchema.include_metadata) {
                    metadata = { type: 'json' };
                }
                break;
            case OutputFormat.HTML:
                formattedContent = typeof content === 'string' ? content : JSON.stringify(content);
                if (activeSchema.escape_html) {
                    formattedContent = this.escapeHtml(formattedContent);
                }
                if (activeSchema.pretty_print) {
                    formattedContent = this.prettyPrintHtml(formattedContent);
                }
                if (activeSchema.include_metadata) {
                    metadata = { type: 'html' };
                }
                break;
            case OutputFormat.MARKDOWN:
                formattedContent = typeof content === 'string' ? content : JSON.stringify(content);
                if (activeSchema.pretty_print) {
                    formattedContent = this.prettyPrintMarkdown(formattedContent);
                }
                if (activeSchema.include_metadata) {
                    metadata = { type: 'markdown' };
                }
                break;
            case OutputFormat.TEXT:
            default:
                formattedContent = typeof content === 'string' ? content : JSON.stringify(content);
                if (activeSchema.include_metadata) {
                    metadata = { type: 'text' };
                }
                break;
        }
        return {
            content: formattedContent,
            format: activeSchema.format,
            metadata: activeSchema.include_metadata ? metadata : undefined
        };
    }
    escapeHtml(text) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }
    prettyPrintHtml(html) {
        return html.replace(/></g, '>\n<')
            .split('\n')
            .map(lin(e: any) => line.trim())
            .join('\n');
    }
    prettyPrintMarkdown(markdown) {
        return markdown.split('\n')
            .map(lin(e: any) => line.trim())
            .join('\n\n')
            .replace(/\n{3,}/g, '\n\n');
    }
}
exports.OutputFormatter = OutputFormatter;
export {};
//# sourceMappingURL=output_formatter.js.map