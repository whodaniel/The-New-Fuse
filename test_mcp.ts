import { MCPClient } from './src/mcp_client.js';
import path from 'path';

/**
 * Test script for MCP client functionality
 */
async function testMCPClient(): any {

    // Create the MCP client
    const mcpClient = new MCPClient();
    
    try {
        // Load the MCP server configurations
        const configPath = path.resolve(__dirname, './mcp_config.json');
        
        await mcpClient.loadServers(configPath);
        
        // Start the MCP servers and discover tools
        
        const tools = await mcpClient.start();
        
        // Show discovered tools
        
        tools.forEach(tool => {
            
        });
        
        // Test a tool if available
        if (tools.length > 0) {
            const testTool = tools[0];

            try {
                // Note: This is a simplistic test that may fail depending on the tool
                // You should adapt the arguments to match what the tool expects
                const result = await testTool.execute({ test: true });
                
            } catch (error) {
                console.error(`Error executing tool: ${error}`);
            }
        }
        
    } catch (error) {
        console.error("Error testing MCP client:", error);
    } finally {
        // Clean up resources
        
        await mcpClient.cleanup();
        
    }
}

// Run the test when the script is executed directly
testMCPClient()
    .catch(error => console.error("Unhandled error:", error))
    .finally(() => process.exit(0));
