const vscode = require('vscode');

/**
 * Test script to diagnose VS Code LLM provider availability
 */
async function testVSCodeLLMProvider() {
    console.log('=== VS Code LLM Provider Diagnostic Test ===\n');
    
    // Check VS Code version
    console.log(`VS Code Version: ${vscode.version}`);
    
    // Check if Language Model API is available
    console.log(`Language Model API Available: ${!!vscode.lm}`);
    
    if (!vscode.lm) {
        console.log('❌ VS Code Language Model API is not available');
        console.log('   This requires VS Code 1.90.0 or higher');
        console.log('   Current requirement in package.json: ^1.90.0');
        return;
    }
    
    console.log('✅ VS Code Language Model API is available');
    
    try {
        // Try to get available models
        console.log('\nChecking for available language models...');
        const models = await vscode.lm.selectChatModels();
        
        if (!models || models.length === 0) {
            console.log('❌ No language models are available');
            console.log('   This typically means GitHub Copilot is not installed or not active');
            console.log('   Please install the GitHub Copilot extension and ensure you have an active subscription');
            return;
        }
        
        console.log(`✅ Found ${models.length} available language model(s):`);
        models.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.name} (ID: ${model.id})`);
            console.log(`      Family: ${model.family || 'Unknown'}`);
            console.log(`      Vendor: ${model.vendor || 'Unknown'}`);
            console.log(`      Version: ${model.version || 'Unknown'}`);
        });
        
        // Test a simple query
        console.log('\nTesting a simple query...');
        const testModel = models[0];
        const messages = [
            vscode.LanguageModelChatMessage.User('Hello, can you respond with "VS Code LLM is working"?')
        ];
        
        try {
            const response = await testModel.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
            
            let responseText = '';
            for await (const chunk of response.text) {
                responseText += chunk;
            }
            
            console.log('✅ LLM Query successful!');
            console.log(`   Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
            
        } catch (queryError) {
            console.log('❌ LLM Query failed:');
            console.log(`   Error: ${queryError.message}`);
            if (queryError.code) {
                console.log(`   Error Code: ${queryError.code}`);
            }
        }
        
    } catch (error) {
        console.log('❌ Error checking language models:');
        console.log(`   ${error.message}`);
        if (error.code) {
            console.log(`   Error Code: ${error.code}`);
        }
    }
    
    console.log('\n=== Diagnostic Complete ===');
}

// Export for VS Code command
async function runDiagnostic() {
    try {
        await testVSCodeLLMProvider();
        vscode.window.showInformationMessage('VS Code LLM diagnostic complete. Check the output panel for results.');
    } catch (error) {
        console.error('Diagnostic failed:', error);
        vscode.window.showErrorMessage(`Diagnostic failed: ${error.message}`);
    }
}

module.exports = {
    testVSCodeLLMProvider,
    runDiagnostic
};
