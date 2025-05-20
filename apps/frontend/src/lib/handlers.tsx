    constructor() {
        this.browserActive = false;
        this.browserStarting = false;
        this.commandValid = false;
        this.commandError = null;
        this.activeOperations = [];
    }
    async startBrowser() {
        if (this.browserStarting)
            return;
        try {
            this.browserStarting = true;
            const response = await fetch('/api/browser/start', {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Failed to start browser');
            this.browserActive = true;
            this.showToast('success', 'Browser Started', 'Browser session initialized successfully');
        }
        catch (error) {
            this.showToast('error', 'Browser Error', error.message);
        }
        finally {
            this.browserStarting = false;
        }
    }
    async takeScreenshot() {
        if (!this.browserActive) {
            this.showToast('error', 'Browser Error', 'Browser is not active');
            return;
        }
        try {
            const response = await fetch('/api/browser/screenshot', {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Failed to take screenshot');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot-${Date.now()}.png`;
            a.click();
            this.showToast('success', 'Screenshot', 'Screenshot saved successfully');
        }
        catch (error) {
            this.showToast('error', 'Screenshot Error', error.message);
        }
    }
    async handleCommand(command, args) {
        const commands = {
            'search': this.handleSearchCommand,
            'browse': this.handleBrowseCommand,
            'screenshot': this.takeScreenshot,
            'export': this.exportResults,
            'help': this.showHelp
        };
        const handler = commands[command];
        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }
        await handler.call(this, args);
    }
    async handleSearchCommand(args) {
        if (!args)
            throw new Error('Search query required');
        const searchInterface = new SearchInterface();
        await searchInterface.performSearch(args);
    }
    async handleBrowseCommand(args) {
        if (!args)
            throw new Error('URL required');
        if (!this.browserActive) {
            await this.startBrowser();
        }
        await this.navigateTo(args);
    }
    async navigateTo(url) {
        try {
            const response = await fetch('/api/browser/navigate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            if (!response.ok)
                throw new Error('Navigation failed');
            this.showToast('success', 'Navigation', `Navigated to ${url}`);
        }
        catch (error) {
            this.showToast('error', 'Navigation Error', error.message);
        }
    }
    showHelp() {
        const helpText = `
Available commands:
/search <query> - Perform a web search
/browse <url> - Navigate to URL in browser
/screenshot - Take browser screenshot
/export - Export current results
/help - Show this help message
        `.trim();
        this.showToast('info', 'Help', helpText);
    }
}
export {};
//# sourceMappingURL=handlers.js.map