// Import existing modules
import './styles/popup.css';
import { initializeWebSocketConnection } from './src/popup/websocket-connection.js';
import { initializeAiAssistant } from './src/popup/ai-assistant.js';
import { initializeCodeHandler } from './src/popup/code-handler.js';
import { initializeServerManagement } from './src/popup/server-management.js';

// ...existing code...

            if (elements.messageInput) {
                elements.messageInput.value = content;
            }
            
// ...existing code...