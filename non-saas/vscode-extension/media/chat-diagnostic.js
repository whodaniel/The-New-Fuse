// Chat diagnostic helper
(function() {
    console.log('🔍 Chat Diagnostic Running...');
    
    // Check if VS Code API is available
    if (typeof acquireVsCodeApi === 'undefined') {
        console.error('❌ VS Code API not available');
        return;
    }
    
    const vscode = acquireVsCodeApi();
    
    // Check essential elements
    const elements = {
        'messages': document.getElementById('messages'),
        'userInput': document.getElementById('userInput'),
        'sendButton': document.getElementById('sendButton'),
        'chatContainer': document.querySelector('.chat-container')
    };
    
    console.log('📋 Element Check:');
    for (const [name, element] of Object.entries(elements)) {
        console.log(`  ${element ? '✅' : '❌'} ${name}: ${element ? 'Found' : 'Missing'}`);
    }
    
    // Test message sending
    window.testSendMessage = function() {
        console.log('🧪 Testing message send...');
        vscode.postMessage({
            type: 'sendMessage',
            text: 'Test message from diagnostic'
        });
    };
    
    // Add diagnostic button
    const diagnosticBtn = document.createElement('button');
    diagnosticBtn.textContent = '🔍 Run Diagnostic';
    diagnosticBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 5px 10px;';
    diagnosticBtn.onclick = function() {
        console.log('=== CHAT DIAGNOSTIC ===');
        console.log('Elements:', elements);
        console.log('VS Code API:', typeof vscode);
        console.log('Send test message: window.testSendMessage()');
        alert('Check console for diagnostic info');
    };
    document.body.appendChild(diagnosticBtn);
    
    console.log('✅ Diagnostic loaded. Click diagnostic button or run window.testSendMessage()');
})();
