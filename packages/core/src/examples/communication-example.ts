import { UniversalChannel } from '../communication/universal-channel.js';

// Example usage by any participant (AI Agent or User)
const channel = UniversalChannel.getInstance();

// Register as a participant
channel.registerParticipant({
    id: 'trae',  // or 'user_123' for human users
    type: 'ai_agent', // or 'user'
    capabilities: ['code_generation', 'analysis']
});

// Listen for messages
channel.onMessage(message => {
    console.log('Received message:', message);
});

// Send message to another participant
channel.sendMessage('augment', {
    type: 'collaboration_request',
    content: 'Would you like to collaborate on improving the test coverage?'
});

// Get list of active participants
const participants = channel.getActiveParticipants();
export {};
