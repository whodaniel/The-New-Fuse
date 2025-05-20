
class TestHandlers {
    constructor() {
        this.handlers = new UserInterfaceHandlers();
    }

    async runTests() {

        await this.testBrowserControls();
        await this.testCommandProcessing();
        await this.testScreenshotFeature();

    }

    async testBrowserControls() {

        // Test browser start
        await this.handlers.startBrowser();
        console.assert(this.handlers.browserActive, 'Browser should be active after start');
        
        // Test navigation
        await this.handlers.navigateTo('https://example.com');

    }

    async testCommandProcessing() {

        // Test help command
        await this.handlers.handleCommand('help', '');
        
        // Test search command
        await this.handlers.handleCommand('search', 'test query');
        
        // Test invalid command
        try {
            await this.handlers.handleCommand('invalid', '');
            console.error('Invalid command should throw error');
        } catch (error) {
            
        }

    }

    async testScreenshotFeature() {

        if (!this.handlers.browserActive) {
            await this.handlers.startBrowser();
        }
        
        await this.handlers.takeScreenshot();

    }
}

// Run tests
const runAllTests = async () => {
    const tester = new TestHandlers();
    await tester.runTests();
};

// Only run tests in development environment
if (process.env.NODE_ENV === 'development') {
    runAllTests().catch(console.error);
}
export {};
