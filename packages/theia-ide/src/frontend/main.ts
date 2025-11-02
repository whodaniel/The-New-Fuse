/**
 * The New Fuse Theia IDE Frontend
 * Modern AI-powered frontend modules and configuration
 */

import { FrontendApplication, FrontendApplicationModule } from '@theia/core/lib/browser/frontend-application';
import { Container, ContainerModule } from '@theia/core/shared/inversify';

// Core frontend modules
import { messagingFrontendModule } from '@theia/core/lib/browser/messaging/messaging-frontend-module';
import { loggerFrontendModule } from '@theia/core/lib/browser/logger-frontend-module';
import { keyboardFrontendModule } from '@theia/core/lib/browser/keyboard/keyboard-frontend-module';
import { workspaceFrontendModule } from '@theia/workspace/lib/browser/workspace-frontend-module';
import { fileSystemFrontendModule } from '@theia/filesystem/lib/browser/filesystem-frontend-module';
import { editorFrontendModule } from '@theia/editor/lib/browser/editor-frontend-module';
import { navigatorFrontendModule } from '@theia/navigator/lib/browser/navigator-frontend-module';
import { terminalFrontendModule } from '@theia/terminal/lib/browser/terminal-frontend-module';

// Monaco and Language Support
import { monacoFrontendModule } from '@theia/monaco/lib/browser/monaco-frontend-module';

// Version Control
import { gitFrontendModule } from '@theia/git/lib/browser/git-frontend-module';
import { scmFrontendModule } from '@theia/scm/lib/browser/scm-frontend-module';

// Debugging
import { debugFrontendModule } from '@theia/debug/lib/browser/debug-frontend-module';

// Extensions and Plugins  
import { pluginExtFrontendModule } from '@theia/plugin-ext/lib/main/browser/plugin-ext-frontend-module';
import { vsxRegistryFrontendModule } from '@theia/vsx-registry/lib/browser/vsx-registry-frontend-module';

// Search and navigation
import { searchInWorkspaceFrontendModule } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-module';

// AI Features (Cutting-edge 2025)
import { aiCoreFrontendModule } from '@theia/ai-core/lib/browser/ai-core-frontend-module';
import { aiChatFrontendModule } from '@theia/ai-chat/lib/browser/ai-chat-frontend-module';
import { aiAnthropicFrontendModule } from '@theia/ai-anthropic/lib/browser/ai-anthropic-frontend-module';
import { aiOpenaiFrontendModule } from '@theia/ai-openai/lib/browser/ai-openai-frontend-module';
import { aiOllamaFrontendModule } from '@theia/ai-ollama/lib/browser/ai-ollama-frontend-module';
import { aiHuggingfaceFrontendModule } from '@theia/ai-huggingface/lib/browser/ai-huggingface-frontend-module';

// Additional modules
import { markersFrontendModule } from '@theia/markers/lib/browser/markers-frontend-module';
import { messagesFrontendModule } from '@theia/messages/lib/browser/messages-frontend-module';
import { outlineViewFrontendModule } from '@theia/outline-view/lib/browser/outline-view-frontend-module';
import { outputFrontendModule } from '@theia/output/lib/browser/output-frontend-module';
import { preferencesFrontendModule } from '@theia/preferences/lib/browser/preferences-frontend-module';
import { toolbarFrontendModule } from '@theia/toolbar/lib/browser/toolbar-frontend-module';
import { gettingStartedFrontendModule } from '@theia/getting-started/lib/browser/getting-started-frontend-module';

// Custom TNF modules
const tnfCustomizationModule = new ContainerModule(bind => {
    // Custom welcome screen configuration
    bind('ThemeService').toSelf().inSingletonScope();
    
    // AI integration customizations
    bind('AIIntegrationService').toSelf().inSingletonScope();
    
    // MCP protocol integration
    bind('MCPService').toSelf().inSingletonScope();
});

// Create frontend container
function createContainer(): Container {
    const container = new Container();

    // Load frontend modules
    container.load(
        // Core modules
        FrontendApplicationModule,
        messagingFrontendModule,
        loggerFrontendModule,
        keyboardFrontendModule,
        
        // File system and workspace
        fileSystemFrontendModule,
        workspaceFrontendModule,
        
        // Editor and Monaco
        editorFrontendModule,
        monacoFrontendModule,
        
        // Navigation and UI
        navigatorFrontendModule,
        terminalFrontendModule,
        
        // Version control
        gitFrontendModule,
        scmFrontendModule,
        
        // Debugging
        debugFrontendModule,
        
        // Extensions
        pluginExtFrontendModule,
        vsxRegistryFrontendModule,
        
        // Search
        searchInWorkspaceFrontendModule,
        
        // Additional modules
        markersFrontendModule,
        messagesFrontendModule,
        outlineViewFrontendModule,
        outputFrontendModule,
        preferencesFrontendModule,
        toolbarFrontendModule,
        gettingStartedFrontendModule,
        
        // AI Features (Cutting-edge 2025)
        aiCoreFrontendModule,
        aiChatFrontendModule,
        aiAnthropicFrontendModule,
        aiOpenaiFrontendModule,
        aiOllamaFrontendModule,
        aiHuggingfaceFrontendModule,
        
        // Custom TNF modules
        tnfCustomizationModule
    );

    return container;
}

// Application startup
async function startFrontendApplication(): Promise<void> {
    console.log('🎨 Starting The New Fuse IDE Frontend...');
    
    try {
        // Create container
        const container = createContainer();
        
        // Get application instance
        const application = container.get(FrontendApplication);
        
        // Start the frontend application
        await application.start();
        
        console.log('✅ The New Fuse IDE Frontend started successfully!');
        console.log('🎨 Modern UI with cutting-edge features enabled');
        console.log('🤖 AI chat and coding assistance ready');
        console.log('🔧 All development tools available');
        
    } catch (error) {
        console.error('❌ Failed to start The New Fuse IDE Frontend:', error);
        throw error;
    }
}

// Initialize the frontend
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        startFrontendApplication().catch(console.error);
    });
} else {
    // Node environment - export for testing
    export { startFrontendApplication, createContainer };
}