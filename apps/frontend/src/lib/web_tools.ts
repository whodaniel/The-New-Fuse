    constructor() {
        this.tools = new Map();
        this.initializeTools();
    }
    initializeTools() {
        this.registerTool('browser', new BrowserTool());
        this.registerTool('calculator', new CalculatorTool());
        this.registerTool('notepad', new NotepadTool());
        this.registerTool('search', new SearchTool());
    }
    registerTool(name, tool) {
        this.tools.set(name, tool);
    }
    async executeTool(name, params) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }
        return await tool.execute(params);
    }
}
class BaseTool {
    constructor() {
        if (this.constructor === BaseTool) {
            throw new Error("Can't instantiate abstract class");
        }
    }
    async execute(params) {
        throw new Error('Method not implemented');
    }
}
class BrowserTool extends BaseTool {
    async execute({ url }) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            return {
                success: true,
                data: data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
class CalculatorTool extends BaseTool {
    execute({ expression }) {
        try {
            const result = Function('return (' + expression + ')')();
            return {
                success: true,
                result: result
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Invalid expression'
            };
        }
    }
}
class NotepadTool extends BaseTool {
    constructor() {
        super();
        this.notes = new Map();
    }
    execute({ action, id, content }) {
        switch (action) {
            case 'create':
                return this.createNote(content);
            case 'read':
                return this.readNote(id);
            case 'update':
                return this.updateNote(id, content);
            case 'delete':
                return this.deleteNote(id);
            default:
                return {
                    success: false,
                    error: 'Invalid action'
                };
        }
    }
    createNote(content) {
        const id = Date.now().toString();
        this.notes.set(id, content);
        return {
            success: true,
            id: id
        };
    }
    readNote(id) {
        const content = this.notes.get(id);
        return content ? {
            success: true,
            content: content
        } : {
            success: false,
            error: 'Note not found'
        };
    }
    updateNote(id, content) {
        if (this.notes.has(id)) {
            this.notes.set(id, content);
            return {
                success: true
            };
        }
        return {
            success: false,
            error: 'Note not found'
        };
    }
    deleteNote(id) {
        const deleted = this.notes.delete(id);
        return {
            success: deleted,
            error: deleted ? null : 'Note not found'
        };
    }
}
class SearchTool extends BaseTool {
    async execute({ query, engine = 'google' }) {
        const engines = {
            google: 'https://www.google.com/search?q=',
            bing: 'https://www.bing.com/search?q=',
            duckduckgo: 'https://duckduckgo.com/?q='
        };
        const baseUrl = engines[engine] || engines.google;
        const searchUrl = baseUrl + encodeURIComponent(query);
        return {
            success: true,
            url: searchUrl
        };
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.webTools = new WebToolsManager();
});
export {};
//# sourceMappingURL=web_tools.js.map