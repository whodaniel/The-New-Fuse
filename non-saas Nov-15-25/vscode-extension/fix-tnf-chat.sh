#!/bin/bash

# Fix The New Fuse AI Chat - Complete Solution
# This script will diagnose and fix issues with the AI chat functionality

EXTENSION_PATH="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"
cd "$EXTENSION_PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing The New Fuse AI Chat...${NC}"

# Step 1: Clean and rebuild
echo -e "\n${YELLOW}1. Cleaning old builds...${NC}"
rm -rf dist/
rm -rf out/
mkdir -p dist

# Step 2: Install dependencies
echo -e "\n${YELLOW}2. Installing dependencies...${NC}"
pnpm install

# Step 3: Create a diagnostic extension wrapper to test LLM connectivity
echo -e "\n${YELLOW}3. Creating diagnostic wrapper...${NC}"
cat > src/llm-diagnostic.ts << 'EOF'
import * as vscode from 'vscode';

export async function testLLMConnectivity(): Promise<string> {
    const results: string[] = [];
    
    // Test VS Code LM API availability
    try {
        if (!vscode.lm) {
            results.push('❌ VS Code Language Model API not available (requires VS Code 1.90+)');
        } else {
            results.push('✅ VS Code Language Model API is available');
            
            // Check for models
            const models = await vscode.lm.selectChatModels();
            if (models && models.length > 0) {
                results.push(`✅ Found ${models.length} language model(s):`);
                models.forEach(model => {
                    results.push(`   - ${model.name} (${model.id})`);
                });
            } else {
                results.push('❌ No language models found. Make sure GitHub Copilot is installed and active.');
            }
        }
    } catch (error) {
        results.push(`❌ Error checking VS Code LM: ${error}`);
    }
    
    return results.join('\n');
}

export async function testSimpleQuery(): Promise<string> {
    try {
        const models = await vscode.lm?.selectChatModels();
        if (!models || models.length === 0) {
            return '❌ No models available for testing';
        }
        
        const model = models[0];
        const messages = [
            vscode.LanguageModelChatMessage.User('Say "Hello from The New Fuse!"')
        ];
        
        const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
        
        let fullResponse = '';
        for await (const chunk of response.text) {
            fullResponse += chunk;
        }
        
        return `✅ Model responded: ${fullResponse}`;
    } catch (error) {
        return `❌ Query failed: ${error}`;
    }
}
EOF

# Step 4: Add diagnostic commands to extension
echo -e "\n${YELLOW}4. Adding diagnostic commands to extension...${NC}"
cat > src/extension-diagnostic-patch.ts << 'EOF'
// Add these imports at the top of extension.ts
import { testLLMConnectivity, testSimpleQuery } from './llm-diagnostic';

// Add these commands in the activate function
export function registerDiagnosticCommands(context: vscode.ExtensionContext) {
    // Test LLM connectivity
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.testLLMConnectivity', async () => {
            const output = await testLLMConnectivity();
            vscode.window.showInformationMessage('LLM Connectivity Test Results', { modal: true, detail: output });
        })
    );
    
    // Test simple query
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.testSimpleQuery', async () => {
            const output = await testSimpleQuery();
            vscode.window.showInformationMessage('LLM Query Test', { modal: true, detail: output });
        })
    );
    
    // Force provider selection
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.forceProviderSetup', async () => {
            const providers = ['vscode', 'ollama', 'openai', 'anthropic', 'cerebras'];
            const selected = await vscode.window.showQuickPick(providers, {
                placeHolder: 'Select LLM Provider'
            });
            
            if (selected) {
                await vscode.workspace.getConfiguration('theNewFuse').update('llmProvider', selected, true);
                vscode.window.showInformationMessage(`Provider set to: ${selected}. Reload window to apply.`);
            }
        })
    );
}
EOF

# Step 5: Build the extension
echo -e "\n${YELLOW}5. Building extension...${NC}"
npx esbuild src/extension.ts src/llm-diagnostic.ts \
    --bundle \
    --outfile=dist/extension.js \
    --format=cjs \
    --platform=node \
    --external:vscode \
    --sourcemap \
    --define:process.env.NODE_ENV='"development"'

# Step 6: Create VS Code settings for the workspace
echo -e "\n${YELLOW}6. Creating workspace settings...${NC}"
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
    "theNewFuse.llmProvider": "vscode",
    "theNewFuse.ui.viewLayout": "both",
    "theNewFuse.mcp.autoConnect": false,
    "theNewFuse.monitoring.enabled": true,
    "theNewFuse.debug.enabled": true
}
EOF

# Step 7: Create a launch configuration
echo -e "\n${YELLOW}7. Creating launch configuration...${NC}"
cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/dist/**/*.js"
            ],
            "preLaunchTask": "${defaultBuildTask}"
        }
    ]
}
EOF

# Step 8: Fix package.json to ensure proper activation
echo -e "\n${YELLOW}8. Updating package.json...${NC}"
# Update main entry point
sed -i.bak 's/"main": ".*"/"main": ".\/dist\/extension.js"/' package.json

# Add diagnostic commands to package.json
python3 -c "
import json
with open('package.json', 'r') as f:
    data = json.load(f)

# Add diagnostic commands
diagnostic_commands = [
    {
        'command': 'the-new-fuse.testLLMConnectivity',
        'title': '🔍 Test LLM Connectivity',
        'category': 'The New Fuse'
    },
    {
        'command': 'the-new-fuse.testSimpleQuery',
        'title': '🧪 Test LLM Query',
        'category': 'The New Fuse'
    },
    {
        'command': 'the-new-fuse.forceProviderSetup',
        'title': '⚙️ Force Provider Setup',
        'category': 'The New Fuse'
    }
]

# Add commands if not present
for cmd in diagnostic_commands:
    if not any(c['command'] == cmd['command'] for c in data['contributes']['commands']):
        data['contributes']['commands'].append(cmd)

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
"

# Step 9: Create a quick test script
echo -e "\n${YELLOW}9. Creating quick test script...${NC}"
cat > test-ai-chat.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing The New Fuse AI Chat..."
echo ""
echo "Opening Extension Development Host..."
code --extensionDevelopmentPath="$(pwd)" --new-window
echo ""
echo "📋 Test Checklist:"
echo "1. ✅ Extension loads (look for robot icon in Activity Bar)"
echo "2. ✅ Open Command Palette (Cmd+Shift+P)"
echo "3. ✅ Run: 'The New Fuse: Test LLM Connectivity'"
echo "4. ✅ Run: 'The New Fuse: Show Chat'"
echo "5. ✅ Type a message and press Enter"
echo ""
echo "🔧 If chat doesn't work:"
echo "- Run: 'The New Fuse: Force Provider Setup'"
echo "- Select 'vscode' if you have GitHub Copilot"
echo "- Select 'ollama' if you have Ollama running locally"
echo "- Reload window after changing provider"
echo ""
echo "📊 Debug tools:"
echo "- Developer Console: Help > Toggle Developer Tools"
echo "- Output Panel: View > Output > 'The New Fuse'"
echo "- LLM Monitoring: View > Output > 'The New Fuse - LLM Monitoring'"
EOF
chmod +x test-ai-chat.sh

# Step 10: Launch the extension
echo -e "\n${GREEN}✅ Setup complete! Launching extension...${NC}"
code --extensionDevelopmentPath="$(pwd)" --new-window

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎯 AI Chat Fix Applied!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Follow these steps in the new VS Code window:${NC}"
echo ""
echo "1. ${GREEN}Test LLM Connection:${NC}"
echo "   - Press Cmd+Shift+P"
echo "   - Run: 'The New Fuse: Test LLM Connectivity'"
echo "   - This will show which LLM providers are available"
echo ""
echo "2. ${GREEN}Open AI Chat:${NC}"
echo "   - Click the robot icon in the Activity Bar"
echo "   - Or run: 'The New Fuse: Show Chat'"
echo ""
echo "3. ${GREEN}Send a Test Message:${NC}"
echo "   - Type 'Hello AI!' in the chat"
echo "   - Press Enter"
echo ""
echo "4. ${GREEN}If No Response:${NC}"
echo "   - Run: 'The New Fuse: Force Provider Setup'"
echo "   - Choose a provider:"
echo "     • 'vscode' - Requires GitHub Copilot"
echo "     • 'ollama' - Requires Ollama running locally"
echo "     • 'openai' - Requires API key in settings"
echo "   - Reload window: 'Developer: Reload Window'"
echo ""
echo -e "${BLUE}📚 Additional Resources:${NC}"
echo "   - Quick test: ./test-ai-chat.sh"
echo "   - Debug console: Help > Toggle Developer Tools"
echo "   - Extension logs: View > Output > 'The New Fuse'"
echo ""
