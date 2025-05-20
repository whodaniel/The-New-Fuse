import { AgentMCPIntegration } from './agent_mcp_integration.js';
// Replace this import with your actual MyAgent class
// import { MyAgent } from './my_agent_class.js'; 

/**
 * Example of integrating MCP tools with your agent
 */
async function initializeAgentWithMCP(): any {

    // Initialize the MCP integration
    const mcpIntegration = new AgentMCPIntegration();
    try {
        const success = await mcpIntegration.initialize();
        if (!success) {
            console.warn("MCP initialization failed, continuing without MCP tools");
        }
    } catch (error) {
        console.error("Error initializing MCP:", error);
        console.warn("Continuing without MCP tools");
    }
    
    // Get the discovered tools
    const mcpTools = mcpIntegration.getTools();

    // Log tools for debugging
    mcpTools.forEach(tool => {
        
    });
    
    // ---- Initialize your agent with the tools ----
    // This is where you would integrate with your actual agent
    
    /*
    // Example with a hypothetical MyAgent class:
    const agent = new MyAgent({
        // Your normal agent configurations
        tools: mcpTools  // Pass the MCP tools to your agent
    });
    
    // Start your application logic with the agent
    startYourApplication(agent);
    
    // Ensure proper cleanup on application exit
    process.on('beforeExit', async () => {
        await mcpIntegration.cleanup();
    });
    */
    
    // For this example, we'll just return the tools
    return mcpTools;
}

/**
 * Example function to demonstrate using MCP tools with an agent
 */
async function runExampleWithMCPTools(): any {
    const mcpTools = await initializeAgentWithMCP();
    
    if (mcpTools.length === 0) {
        
        return;
    }
    
    // Example: Find a filesystem tool and use it
    const listFilesTool = mcpTools.find(tool => tool.name === 'list_files');
    if (listFilesTool) {
        try {
            
            const result = await listFilesTool.execute({ path: "./data" });
            
        } catch (error) {
            console.error("Error using list_files tool:", error);
        }
    } else {
        
    }
    
    // Example: Find a search tool and use it
    const searchTool = mcpTools.find(tool => tool.name === 'brave_search');
    if (searchTool) {
        try {
            
            const result = await searchTool.execute({ query: "TypeScript MCP protocol" });
            
        } catch (error) {
            console.error("Error using brave_search tool:", error);
        }
    } else {
        
    }
    
    // Clean up after example
    const mcpIntegration = new AgentMCPIntegration();
    await mcpIntegration.cleanup();
}

// For direct testing: 
// Run with: ts-node agent_with_mcp_example.ts
if (require.main === module) {
    runExampleWithMCPTools()
        .catch(error => console.error("Error in example:", error))
        .finally(() => process.exit(0));
}
