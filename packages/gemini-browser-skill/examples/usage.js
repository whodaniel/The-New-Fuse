"use strict";
/**
 * Gemini Browser Skill - Example Usage
 *
 * Demonstrates how to use the Gemini browser automation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleDirectUsage = exampleDirectUsage;
exports.exampleMCPUsage = exampleMCPUsage;
exports.exampleTNFIntegration = exampleTNFIntegration;
const src_1 = require("../src");
async function exampleDirectUsage() {
    console.log('\n=== Direct Usage Example ===\n');
    // Initialize the browser
    console.log('Initializing Gemini browser...');
    const initialized = await src_1.geminiBrowser.initialize();
    if (!initialized) {
        console.error('Failed to initialize browser');
        return;
    }
    console.log('✓ Browser initialized\n');
    // Example 1: Simple prompt
    console.log('Example 1: Simple Prompt');
    const response1 = await src_1.geminiBrowser.prompt({
        prompt: 'What are the top 3 programming languages in 2024?',
    });
    if (response1.success) {
        console.log('Response:', response1.response);
    }
    else {
        console.error('Error:', response1.error);
    }
    // Example 2: Prompt with context URLs
    console.log('\nExample 2: Prompt with Context URLs');
    const response2 = await src_1.geminiBrowser.prompt({
        prompt: 'Summarize the main features of this product',
        contextUrls: ['https://github.com/features'],
    });
    if (response2.success) {
        console.log('Response:', response2.response);
    }
    else {
        console.error('Error:', response2.error);
    }
    // Example 3: Research across multiple sources
    console.log('\nExample 3: Multi-Source Research');
    const response3 = await src_1.geminiBrowser.prompt({
        prompt: 'Compare the AI capabilities mentioned on these pages',
        contextUrls: ['https://openai.com', 'https://anthropic.com', 'https://deepmind.google'],
        timeout: 60000, // Longer timeout for complex research
    });
    if (response3.success) {
        console.log('Response:', response3.response);
    }
    else {
        console.error('Error:', response3.error);
    }
    // Close the browser
    console.log('\nClosing browser...');
    await src_1.geminiBrowser.close();
    console.log('✓ Browser closed\n');
}
async function exampleMCPUsage() {
    console.log('\n=== MCP Server Usage Example ===\n');
    // Get available tools
    const tools = src_1.geminiBrowserMCP.getTools();
    console.log('Available tools:');
    tools.forEach((tool) => {
        console.log(`  - ${tool.name}: ${tool.description}`);
    });
    // Initialize via MCP
    console.log('\nInitializing via MCP...');
    const initResult = await src_1.geminiBrowserMCP.executeTool({
        name: 'gemini_browser_initialize',
        arguments: {},
    });
    console.log('Result:', initResult.content[0].text);
    // Check status
    console.log('\nChecking status...');
    const statusResult = await src_1.geminiBrowserMCP.executeTool({
        name: 'gemini_browser_status',
        arguments: {},
    });
    console.log('Status:', statusResult.content[0].text);
    // Send a prompt via MCP
    console.log('\nSending prompt via MCP...');
    const promptResult = await src_1.geminiBrowserMCP.executeTool({
        name: 'gemini_browser_prompt',
        arguments: {
            prompt: 'What is The New Fuse framework?',
            contextUrls: ['https://thenewfuse.com'],
        },
    });
    if (!promptResult.isError) {
        console.log('Response:', promptResult.content[0].text);
    }
    else {
        console.error('Error:', promptResult.content[0].text);
    }
    // Close via MCP
    console.log('\nClosing via MCP...');
    const closeResult = await src_1.geminiBrowserMCP.executeTool({
        name: 'gemini_browser_close',
        arguments: {},
    });
    console.log('Result:', closeResult.content[0].text);
}
async function exampleTNFIntegration() {
    console.log('\n=== TNF Agent Integration Example ===\n');
    // Simulate a TNF agent delegating a research task to Gemini
    console.log('TNF Agent: I need to research AI frameworks...');
    console.log('TNF Agent: Delegating to Gemini browser automation...\n');
    await src_1.geminiBrowser.initialize();
    const researchTask = await src_1.geminiBrowser.prompt({
        prompt: `
      Research the following AI frameworks and provide a comparison:
      - Focus on their key features
      - Note their primary use cases
      - Identify their strengths and weaknesses
    `,
        contextUrls: ['https://www.tensorflow.org', 'https://pytorch.org', 'https://keras.io'],
        timeout: 90000,
    });
    if (researchTask.success) {
        console.log('TNF Agent: Received research from Gemini:');
        console.log(researchTask.response);
        console.log('\nTNF Agent: Research complete! Cost: $0 (free Gemini compute) 🎉');
    }
    else {
        console.error('TNF Agent: Research failed:', researchTask.error);
    }
    await src_1.geminiBrowser.close();
}
// Run examples
async function main() {
    const args = process.argv.slice(2);
    const example = args[0] || 'all';
    try {
        switch (example) {
            case 'direct':
                await exampleDirectUsage();
                break;
            case 'mcp':
                await exampleMCPUsage();
                break;
            case 'tnf':
                await exampleTNFIntegration();
                break;
            case 'all':
            default:
                await exampleDirectUsage();
                await exampleMCPUsage();
                await exampleTNFIntegration();
                break;
        }
        console.log('\n✓ All examples completed successfully!\n');
    }
    catch (error) {
        console.error('\n✗ Example failed:', error);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUFxTE0sZ0RBQWtCO0FBQUUsMENBQWU7QUFBRSxzREFBcUI7QUFuTG5FLGdDQUF5RDtBQUV6RCxLQUFLLFVBQVUsa0JBQWtCO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQztJQUVoRCx5QkFBeUI7SUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sV0FBVyxHQUFHLE1BQU0sbUJBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUVyRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakIsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzlDLE9BQU87SUFDVCxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBRXZDLDJCQUEyQjtJQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDeEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxtQkFBYSxDQUFDLE1BQU0sQ0FBQztRQUMzQyxNQUFNLEVBQUUsbURBQW1EO0tBQzVELENBQUMsQ0FBQztJQUVILElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsc0NBQXNDO0lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUNyRCxNQUFNLFNBQVMsR0FBRyxNQUFNLG1CQUFhLENBQUMsTUFBTSxDQUFD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ZixPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztBQUNILENBQUM7QUFFRCwyQkFBMkI7QUFDM0IsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLElBQUksRUFBRSxDQUFDO0FBQ1QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR2VtaW5pIEJyb3dzZXIgU2tpbGwgLSBFeGFtcGxlIFVzYWdlXG4gKlxuICogRGVtb25zdHJhdGVzIGhvdyB0byB1c2UgdGhlIEdlbWluaSBicm93c2VyIGF1dG9tYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBnZW1pbmlCcm93c2VyLCBnZW1pbmlCcm93c2VyTUNQIH0gZnJvbSAnLi4vc3JjJztcblxuYXN5bmMgZnVuY3Rpb24gZXhhbXBsZURpcmVjdFVzYWdlKCkge1xuICBjb25zb2xlLmxvZygnXFxuPT09IERpcmVjdCBVc2FnZSBFeGFtcGxlID09PVxcbicpO1xuXG4gIC8vIEluaXRpYWxpemUgdGhlIGJyb3dzZXJcbiAgY29uc29sZS5sb2coJ0luaXRpYWxpemluZyBHZW1pbmkgYnJvd3Nlci4uLicpO1xuICBjb25zdCBpbml0aWFsaXplZCA9IGF3YWl0IGdlbWluaUJyb3dzZXIuaW5pdGlhbGl6ZSgpO1xuXG4gIGlmICghaW5pdGlhbGl6ZWQpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBicm93c2VyJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc29sZS5sb2coJ+KckyBCcm93c2VyIGluaXRpYWxpemVkXFxuJyk7XG5cbiAgLy8gRXhhbXBsZSAxOiBTaW1wbGUgcHJvbXB0XG4gIGNvbnNvbGUubG9nKCdFeGFtcGxlIDE6IFNpbXBsZSBQcm9tcHQnKTtcbiAgY29uc3QgcmVzcG9uc2UxID0gYXdhaXQgZ2VtaW5pQnJvd3Nlci5wcm9tcHQoe1xuICAgIHByb21wdDogJ1doYXQgYXJlIHRoZSB0b3AgMyBwcm9ncmFtbWluZyBsYW5ndWFnZXMgaW4gMjAyND8nLFxuICB9KTtcblxuICBpZiAocmVzcG9uc2UxLnN1Y2Nlc3MpIHtcbiAgICBjb25zb2xlLmxvZygnUmVzcG9uc2U6JywgcmVzcG9uc2UxLnJlc3BvbnNlKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCByZXNwb25zZTEuZXJyb3IpO1xuICB9XG5cbiAgLy8gRXhhbXBsZSAyOiBQcm9tcHQgd2l0aCBjb250ZXh0IFVSTHNcbiAgY29uc29sZS5sb2coJ1xcbkV4YW1wbGUgMjogUHJvbXB0IHdpdGggQ29udGV4dCBVUkxzJyk7XG4gIGNvbnN0IHJlc3BvbnNlMiA9IGF3YWl0IGdlbWluaUJyb3dzZXIucHJvbXB0KHtcbiAgICBwcm9tcHQ6ICdTdW1tYXJpemUgdGhlIG1haW4gZmVhdHVyZXMgb2YgdGhpcyBwcm9kdWN0JyxcbiAgICBjb250ZXh0VXJsczogWydodHRwczovL2dpdGh1Yi5jb20vZmVhdHVyZXMnXSxcbiAgfSk7XG5cbiAgaWYgKHJlc3BvbnNlMi5zdWNjZXNzKSB7XG4gICAgY29uc29sZS5sb2coJ1Jlc3BvbnNlOicsIHJlc3BvbnNlMi5yZXNwb25zZSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgcmVzcG9uc2UyLmVycm9yKTtcbiAgfVxuXG4gIC8vIEV4YW1wbGUgMzogUmVzZWFyY2ggYWNyb3NzIG11bHRpcGxlIHNvdXJjZXNcbiAgY29uc29sZS5sb2coJ1xcbkV4YW1wbGUgMzogTXVsdGktU291cmNlIFJlc2VhcmNoJyk7XG4gIGNvbnN0IHJlc3BvbnNlMyA9IGF3YWl0IGdlbWluaUJyb3dzZXIucHJvbXB0KHtcbiAgICBwcm9tcHQ6ICdDb21wYXJlIHRoZSBBSSBjYXBhYmlsaXRpZXMgbWVudGlvbmVkIG9uIHRoZXNlIHBhZ2VzJyxcbiAgICBjb250ZXh0VXJsczogWydodHRwczovL29wZW5haS5jb20nLCAnaHR0cHM6Ly9hbnRocm9waWMuY29tJywgJ2h0dHBzOi8vZGVlcG1pbmQuZ29vZ2xlJ10sXG4gICAgdGltZW91dDogNjAwMDAsIC8vIExvbmdlciB0aW1lb3V0IGZvciBjb21wbGV4IHJlc2VhcmNoXG4gIH0pO1xuXG4gIGlmIChyZXNwb25zZTMuc3VjY2Vzcykge1xuICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZTonLCByZXNwb25zZTMucmVzcG9uc2UpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIHJlc3BvbnNlMy5lcnJvcik7XG4gIH1cblxuICAvLyBDbG9zZSB0aGUgYnJvd3NlclxuICBjb25zb2xlLmxvZygnXFxuQ2xvc2luZyBicm93c2VyLi4uJyk7XG4gIGF3YWl0IGdlbWluaUJyb3dzZXIuY2xvc2UoKTtcbiAgY29uc29sZS5sb2coJ+KckyBCcm93c2VyIGNsb3NlZFxcbicpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleGFtcGxlTUNQVXNhZ2UoKSB7XG4gIGNvbnNvbGUubG9nKCdcXG49PT0gTUNQIFNlcnZlciBVc2FnZSBFeGFtcGxlID09PVxcbicpO1xuXG4gIC8vIEdldCBhdmFpbGFibGUgdG9vbHNcbiAgY29uc3QgdG9vbHMgPSBnZW1pbmlCcm93c2VyTUNQLmdldFRvb2xzKCk7XG4gIGNvbnNvbGUubG9nKCdBdmFpbGFibGUgdG9vbHM6Jyk7XG4gIHRvb2xzLmZvckVhY2goKHRvb2wpID0+IHtcbiAgICBjb25zb2xlLmxvZyhgICAtICR7dG9vbC5uYW1lfTogJHt0b29sLmRlc2NyaXB0aW9ufWApO1xuICB9KTtcblxuICAvLyBJbml0aWFsaXplIHZpYSBNQ1BcbiAgY29uc29sZS5sb2coJ1xcbkluaXRpYWxpemluZyB2aWEgTUNQLi4uJyk7XG4gIGNvbnN0IGluaXRSZXN1bHQgPSBhd2FpdCBnZW1pbmlCcm93c2VyTUNQLmV4ZWN1dGVUb29sKHtcbiAgICBuYW1lOiAnZ2VtaW5pX2Jyb3dzZXJfaW5pdGlhbGl6ZScsXG4gICAgYXJndW1lbnRzOiB7fSxcbiAgfSk7XG4gIGNvbnNvbGUubG9nKCdSZXN1bHQ6JywgaW5pdFJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xuXG4gIC8vIENoZWNrIHN0YXR1c1xuICBjb25zb2xlLmxvZygnXFxuQ2hlY2tpbmcgc3RhdHVzLi4uJyk7XG4gIGNvbnN0IHN0YXR1c1Jlc3VsdCA9IGF3YWl0IGdlbWluaUJyb3dzZXJNQ1AuZXhlY3V0ZVRvb2woe1xuICAgIG5hbWU6ICdnZW1pbmlfYnJvd3Nlcl9zdGF0dXMnLFxuICAgIGFyZ3VtZW50czoge30sXG4gIH0pO1xuICBjb25zb2xlLmxvZygnU3RhdHVzOicsIHN0YXR1c1Jlc3VsdC5jb250ZW50WzBdLnRleHQpO1xuXG4gIC8vIFNlbmQgYSBwcm9tcHQgdmlhIE1DUFxuICBjb25zb2xlLmxvZygnXFxuU2VuZGluZyBwcm9tcHQgdmlhIE1DUC4uLicpO1xuICBjb25zdCBwcm9tcHRSZXN1bHQgPSBhd2FpdCBnZW1pbmlCcm93c2VyTUNQLmV4ZWN1dGVUb29sKHtcbiAgICBuYW1lOiAnZ2VtaW5pX2Jyb3dzZXJfcHJvbXB0JyxcbiAgICBhcmd1bWVudHM6IHtcbiAgICAgIHByb21wdDogJ1doYXQgaXMgVGhlIE5ldyBGdXNlIGZyYW1ld29yaz8nLFxuICAgICAgY29udGV4dFVybHM6IFsnaHR0cHM6Ly90aGVuZXdmdXNlLmNvbSddLFxuICAgIH0sXG4gIH0pO1xuXG4gIGlmICghcHJvbXB0UmVzdWx0LmlzRXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZygnUmVzcG9uc2U6JywgcHJvbXB0UmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgcHJvbXB0UmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XG4gIH1cblxuICAvLyBDbG9zZSB2aWEgTUNQXG4gIGNvbnNvbGUubG9nKCdcXG5DbG9zaW5nIHZpYSBNQ1AuLi4nKTtcbiAgY29uc3QgY2xvc2VSZXN1bHQgPSBhd2FpdCBnZW1pbmlCcm93c2VyTUNQLmV4ZWN1dGVUb29sKHtcbiAgICBuYW1lOiAnZ2VtaW5pX2Jyb3dzZXJfY2xvc2UnLFxuICAgIGFyZ3VtZW50czoge30sXG4gIH0pO1xuICBjb25zb2xlLmxvZygnUmVzdWx0OicsIGNsb3NlUmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4YW1wbGVUTkZJbnRlZ3JhdGlvbigpIHtcbiAgY29uc29sZS5sb2coJ1xcbj09PSBUTkYgQWdlbnQgSW50ZWdyYXRpb24gRXhhbXBsZSA9PT1cXG4nKTtcblxuICAvLyBTaW11bGF0ZSBhIFRORiBhZ2VudCBkZWxlZ2F0aW5nIGEgcmVzZWFyY2ggdGFzayB0byBHZW1pbmlcbiAgY29uc29sZS5sb2coJ1RORiBBZ2VudDogSSBuZWVkIHRvIHJlc2VhcmNoIEFJIGZyYW1ld29ya3MuLi4nKTtcbiAgY29uc29sZS5sb2coJ1RORiBBZ2VudDogRGVsZWdhdGluZyB0byBHZW1pbmkgYnJvd3NlciBhdXRvbWF0aW9uLi4uXFxuJyk7XG5cbiAgYXdhaXQgZ2VtaW5pQnJvd3Nlci5pbml0aWFsaXplKCk7XG5cbiAgY29uc3QgcmVzZWFyY2hUYXNrID0gYXdhaXQgZ2VtaW5pQnJvd3Nlci5wcm9tcHQoe1xuICAgIHByb21wdDogYFxuICAgICAgUmVzZWFyY2ggdGhlIGZvbGxvd2luZyBBSSBmcmFtZXdvcmtzIGFuZCBwcm92aWRlIGEgY29tcGFyaXNvbjpcbiAgICAgIC0gRm9jdXMgb24gdGhlaXIga2V5IGZlYXR1cmVzXG4gICAgICAtIE5vdGUgdGhlaXIgcHJpbWFyeSB1c2UgY2FzZXNcbiAgICAgIC0gSWRlbnRpZnkgdGhlaXIgc3RyZW5ndGhzIGFuZCB3ZWFrbmVzc2VzXG4gICAgYCxcbiAgICBjb250ZXh0VXJsczogWydodHRwczovL3d3dy50ZW5zb3JmbG93Lm9yZycsICdodHRwczovL3B5dG9yY2gub3JnJywgJ2h0dHBzOi8va2VyYXMuaW8nXSxcbiAgICB0aW1lb3V0OiA5MDAwMCxcbiAgfSk7XG5cbiAgaWYgKHJlc2VhcmNoVGFzay5zdWNjZXNzKSB7XG4gICAgY29uc29sZS5sb2coJ1RORiBBZ2VudDogUmVjZWl2ZWQgcmVzZWFyY2ggZnJvbSBHZW1pbmk6Jyk7XG4gICAgY29uc29sZS5sb2cocmVzZWFyY2hUYXNrLnJlc3BvbnNlKTtcbiAgICBjb25zb2xlLmxvZygnXFxuVE5GIEFnZW50OiBSZXNlYXJjaCBjb21wbGV0ZSEgQ29zdDogJDAgKGZyZWUgR2VtaW5pIGNvbXB1dGUpIPCfjoknKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdUTkYgQWdlbnQ6IFJlc2VhcmNoIGZhaWxlZDonLCByZXNlYXJjaFRhc2suZXJyb3IpO1xuICB9XG5cbiAgYXdhaXQgZ2VtaW5pQnJvd3Nlci5jbG9zZSgpO1xufVxuXG4vLyBSdW4gZXhhbXBsZXNcbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG4gIGNvbnN0IGV4YW1wbGUgPSBhcmdzWzBdIHx8ICdhbGwnO1xuXG4gIHRyeSB7XG4gICAgc3dpdGNoIChleGFtcGxlKSB7XG4gICAgICBjYXNlICdkaXJlY3QnOlxuICAgICAgICBhd2FpdCBleGFtcGxlRGlyZWN0VXNhZ2UoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtY3AnOlxuICAgICAgICBhd2FpdCBleGFtcGxlTUNQVXNhZ2UoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0bmYnOlxuICAgICAgICBhd2FpdCBleGFtcGxlVE5GSW50ZWdyYXRpb24oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhbGwnOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXdhaXQgZXhhbXBsZURpcmVjdFVzYWdlKCk7XG4gICAgICAgIGF3YWl0IGV4YW1wbGVNQ1BVc2FnZSgpO1xuICAgICAgICBhd2FpdCBleGFtcGxlVE5GSW50ZWdyYXRpb24oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ1xcbuKckyBBbGwgZXhhbXBsZXMgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSFcXG4nKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdcXG7inJcgRXhhbXBsZSBmYWlsZWQ6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG4vLyBSdW4gaWYgZXhlY3V0ZWQgZGlyZWN0bHlcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCk7XG59XG5cbmV4cG9ydCB7IGV4YW1wbGVEaXJlY3RVc2FnZSwgZXhhbXBsZU1DUFVzYWdlLCBleGFtcGxlVE5GSW50ZWdyYXRpb24gfTtcbiJdfQ==