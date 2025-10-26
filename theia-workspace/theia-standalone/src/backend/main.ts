#!/usr/bin/env node

/**
 * The New Fuse Theia IDE Backend
 * Modern AI-powered development environment with cutting-edge features
 */

import { BackendApplication, CliManager } from '@theia/core/lib/node';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { backendApplicationModule } from '@theia/core/lib/node/backend-application-module';
import { messagingBackendModule } from '@theia/core/lib/node/messaging/messaging-backend-module';
import { loggerBackendModule } from '@theia/core/lib/node/logger-backend-module';

// Core Theia modules
import { workspaceBackendModule } from '@theia/workspace/lib/node/workspace-backend-module';
import { fileSystemBackendModule } from '@theia/filesystem/lib/node/filesystem-backend-module';
import { editorBackendModule } from '@theia/editor/lib/node/editor-backend-module';
import { navigatorBackendModule } from '@theia/navigator/lib/node/navigator-backend-module';
import { terminalBackendModule } from '@theia/terminal/lib/node/terminal-backend-module';

// Monaco and Language Support
import { monacoBackendModule } from '@theia/monaco/lib/node/monaco-backend-module';

// Version Control
import { gitBackendModule } from '@theia/git/lib/node/git-backend-module';
import { scmBackendModule } from '@theia/scm/lib/node/scm-backend-module';

// Debugging
import { debugBackendModule } from '@theia/debug/lib/node/debug-backend-module';

// Extensions and Plugins
import { pluginDeployerBackendModule } from '@theia/plugin-ext/lib/main/node/plugin-deployer-backend-module';
import { pluginBackendModule } from '@theia/plugin-ext/lib/main/node/plugin-backend-module';
import { vsxRegistryBackendModule } from '@theia/vsx-registry/lib/node/vsx-registry-backend-module';

// Search and navigation
import { searchInWorkspaceBackendModule } from '@theia/search-in-workspace/lib/node/search-in-workspace-backend-module';

// AI Features (Cutting-edge 2025)
import { aiCoreBackendModule } from '@theia/ai-core/lib/node/ai-core-backend-module';
import { aiChatBackendModule } from '@theia/ai-chat/lib/node/ai-chat-backend-module';
import { aiAnthropicBackendModule } from '@theia/ai-anthropic/lib/node/ai-anthropic-backend-module';
import { aiOpenaiBackendModule } from '@theia/ai-openai/lib/node/ai-openai-backend-module';
import { aiOllamaBackendModule } from '@theia/ai-ollama/lib/node/ai-ollama-backend-module';
import { aiHuggingfaceBackendModule } from '@theia/ai-huggingface/lib/node/ai-huggingface-backend-module';

// Additional modules
import { markersBackendModule } from '@theia/markers/lib/node/markers-backend-module';
import { messagesBackendModule } from '@theia/messages/lib/node/messages-backend-module';
import { outlineViewBackendModule } from '@theia/outline-view/lib/node/outline-view-backend-module';
import { outputBackendModule } from '@theia/output/lib/node/output-backend-module';
import { preferencesBackendModule } from '@theia/preferences/lib/node/preferences-backend-module';

// Configuration
const PORT = process.env.THEIA_PORT || process.env.PORT || 3002;
const HOSTNAME = process.env.THEIA_HOSTNAME || process.env.HOSTNAME || '0.0.0.0';

// Create application container
function createContainer(): Container {
    const container = new Container();

    // Load all backend modules
    container.load(
        // Core modules
        backendApplicationModule,
        messagingBackendModule, 
        loggerBackendModule,
        
        // File system and workspace
        fileSystemBackendModule,
        workspaceBackendModule,
        
        // Editor and Monaco
        editorBackendModule,
        monacoBackendModule,
        
        // Navigation and UI
        navigatorBackendModule,
        terminalBackendModule,
        
        // Version control
        gitBackendModule,
        scmBackendModule,
        
        // Debugging
        debugBackendModule,
        
        // Extensions
        pluginDeployerBackendModule,
        pluginBackendModule,
        vsxRegistryBackendModule,
        
        // Search
        searchInWorkspaceBackendModule,
        
        // Additional modules
        markersBackendModule,
        messagesBackendModule,
        outlineViewBackendModule,
        outputBackendModule,
        preferencesBackendModule,
        
        // AI Features (Cutting-edge 2025)
        aiCoreBackendModule,
        aiChatBackendModule,
        aiAnthropicBackendModule,
        aiOpenaiBackendModule,
        aiOllamaBackendModule,
        aiHuggingfaceBackendModule
    );

    return container;
}

import { startTheiaIntegration } from '../../../../packages/mcp-core/src/start-theia-integration';

// Application startup
async function startApplication(): Promise<void> {
    await startTheiaIntegration();
    console.log('🚀 Starting The New Fuse IDE with cutting-edge features...');
    console.log(`🌐 Server will be available at http://${HOSTNAME}:${PORT}`);
    console.log('🤖 AI Features: Enabled (OpenAI, Anthropic, Ollama, HuggingFace)');
    console.log('🔗 MCP Protocol: Enabled'); 
    console.log('🎨 Modern Monaco Editor: Latest version');
    console.log('🧩 VS Code Extensions: OpenVSX Registry');
    console.log('🔧 LSP/DAP Support: Enabled');
    
    try {
        // Create container
        const container = createContainer();
        
        // Get application instance
        const application = container.get(BackendApplication);
        
        // Start the application
        await application.start(PORT, HOSTNAME);
        
        console.log('✅ The New Fuse IDE Server started successfully!');
        console.log(`🌐 IDE available at http://${HOSTNAME}:${PORT}`);
        console.log('💡 Features available:');
        console.log('   • AI-powered Theia with multiple LLM providers');
        console.log('   • Model Context Protocol (MCP) integration');
        console.log('   • Modern Monaco editor with latest features');
        console.log('   • VS Code extension compatibility');
        console.log('   • Language Server Protocol (LSP)');
        console.log('   • Debug Adapter Protocol (DAP)');
        console.log('   • Git integration and version control');
        console.log('   • Extensible plugin system');
        console.log('🎯 Ready for cutting-edge development!');
        
    } catch (error) {
        console.error('❌ Failed to start The New Fuse IDE:', error);
        process.exit(1);
    }
}

// CLI integration
async function main(): Promise<void> {
    const manager = new CliManager();
    await manager.initPackageManager();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
        case undefined:
            await startApplication();
            break;
            
        case 'version':
            console.log('The New Fuse IDE v2.0.0 (Theia 1.59)');
            break;
            
        default:
            console.log('Available commands: start, version');
            console.log('Usage: node main.ts [start|version]');
            process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Start the application
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Application startup failed:', error);
        process.exit(1);
    });
}