import * as vscode from 'vscode';

export async function activateSimpleChat(context: vscode.ExtensionContext) {
    // Register a command that will open a chat interface
    const chatCommand = vscode.commands.registerCommand('theNewFuse.simpleChat', async () => {
        try {
            // Select a chat model.
            // We are requesting the 'copilot' vendor and 'gpt-4o' family here as an example.
            // You might need to adjust this based on available models or user preferences.
            const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });

            if (!model) {
                vscode.window.showErrorMessage('No suitable chat model found.');
                return;
            }

            // Create a chat panel (using a webview for simplicity here)
            const panel = vscode.window.createWebviewPanel(
                'simpleChat',
                'Simple Chat',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = getWebviewContent();

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === 'sendMessage') {
                        const userMessage = message.text;
                        
                        // Send the user's message to the language model
                        const messages = [
                            new vscode.LanguageModelChatMessage(vscode.LanguageModelChatMessageRole.User, userMessage)
                        ];
                        
                        const chatRequest = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
                        
                        let responseText = '';
                        for await (const chunk of chatRequest.stream) {
                            responseText += chunk;
                            // Post incremental updates to the webview
                            panel.webview.postMessage({ command: 'updateResponse', text: responseText });
                        }
                        // Post the final complete response
                        panel.webview.postMessage({ command: 'finalResponse', text: responseText });
                    }
                },
                undefined,
                context.subscriptions
            );

        } catch (err) {
            console.error('Error in simpleChat command:', err);
            if (err instanceof vscode.LanguageModelError) {
                vscode.window.showErrorMessage(`Language Model Error: ${err.message} (Code: ${err.code})`);
            } else if (err instanceof Error) {
                vscode.window.showErrorMessage(`Error: ${err.message}`);
            } else {
                vscode.window.showErrorMessage('An unknown error occurred.');
            }
        }
    });

    context.subscriptions.push(chatCommand);
    vscode.window.showInformationMessage('Simple Chat Extension Activated! Use "Simple Chat" command.');
}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Chat</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        #chatbox { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: scroll; margin-bottom: 10px; }
        #userInput { width: calc(100% - 60px); padding: 8px; margin-right: 5px; }
        button { padding: 8px 12px; }
    </style>
</head>
<body>
    <h1>Simple Chat with LM API</h1>
    <div id="chatbox">
        <p><i>Ask something...</i></p>
    </div>
    <input type="text" id="userInput" placeholder="Type your message here...">
    <button id="sendButton">Send</button>

    <script>
        const vscode = acquireVsCodeApi();
        const chatbox = document.getElementById('chatbox');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');

        sendButton.addEventListener('click', () => {
            const messageText = userInput.value;
            if (messageText.trim() === '') return;

            // Display user message
            const userP = document.createElement('p');
            userP.innerHTML = \`<b>You:</b> \${messageText}\`;
            chatbox.appendChild(userP);
            chatbox.scrollTop = chatbox.scrollHeight;

            vscode.postMessage({
                command: 'sendMessage',
                text: messageText
            });
            userInput.value = '';
        });

        let assistantMessageElement = null;

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateResponse':
                    if (!assistantMessageElement) {
                        assistantMessageElement = document.createElement('p');
                        chatbox.appendChild(assistantMessageElement);
                    }
                    assistantMessageElement.innerHTML = \`<b>Assistant:</b> \${message.text}\`;
                    chatbox.scrollTop = chatbox.scrollHeight;
                    break;
                case 'finalResponse':
                     if (!assistantMessageElement) { // Should not happen if updateResponse was called
                        assistantMessageElement = document.createElement('p');
                        chatbox.appendChild(assistantMessageElement);
                    }
                    assistantMessageElement.innerHTML = \`<b>Assistant:</b> \${message.text}\`; // Final, clean update
                    assistantMessageElement = null; // Reset for next message
                    chatbox.scrollTop = chatbox.scrollHeight;
                    break;
            }
        });
    </script>
</body>
</html>`;
}

export function deactivateSimpleChat() {
    console.log('Simple Chat Extension Deactivated.');
}
