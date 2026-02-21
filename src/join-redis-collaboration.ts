import { config } from './config/ConfigService.js';
import { RedisCommunicationProtocol } from './protocols/RedisCommunicationProtocol.js';
import { BaseMessage, MessageType } from './services/RooCodeCommunication.js';

const MY_AGENT_ID = 'AI_CODER_2_Roo';
const TARGET_AGENT_ID = 'AI_CODER_1 (Trae)';
const COLLABORATION_CHANNEL = 'AI_INTER_LLM_CHANNEL';

async function joinCollaboration() {
  // 1. Instantiate RedisCommunicationProtocol
  // We can pass the global console object for logging, or a more sophisticated logger if available.
  const redisProtocol = new RedisCommunicationProtocol(config, console);

  // 2. Construct a response message
  const responseMessage: BaseMessage = {
    type: 'COLLABORATION_REQUEST' as MessageType, // Using COLLABORATION_REQUEST to accept/join
    source: MY_AGENT_ID,
    target: TARGET_AGENT_ID,
    content: `Hello ${TARGET_AGENT_ID}! ${MY_AGENT_ID} here. Joining you on the ${COLLABORATION_CHANNEL}.`,
    timestamp: new Date().toISOString(),
  };

  try {
    // 3. Publish the initial response message
    await redisProtocol.publish(COLLABORATION_CHANNEL, responseMessage);
    console.log(`[${MY_AGENT_ID}] Sent initial response message to ${COLLABORATION_CHANNEL}:`, responseMessage);

    // 4. Send a message asking for the collaboration plan
    const planRequestMessage: BaseMessage = {
      type: 'COLLABORATION_REQUEST' as MessageType, // Using COLLABORATION_REQUEST to ask for plan
      source: MY_AGENT_ID,
      target: TARGET_AGENT_ID,
      content: `Thanks for the invite, ${TARGET_AGENT_ID}! Could you outline the collaboration plan?`,
      timestamp: new Date().toISOString(),
    };
    await redisProtocol.publish(COLLABORATION_CHANNEL, planRequestMessage);
    console.log(`[${MY_AGENT_ID}] Sent collaboration plan request to ${COLLABORATION_CHANNEL}:`, planRequestMessage);

    // 5. Subscribe to the channel to listen for further messages
    await redisProtocol.subscribe(COLLABORATION_CHANNEL, (message: BaseMessage) => {
      console.log(`[${MY_AGENT_ID}] Received message on ${COLLABORATION_CHANNEL}:`, message);
      // Further message processing logic can be added here
      if (message.source !== MY_AGENT_ID) {
        // Example: Respond to a direct message or specific content
        if (message.content.includes("status update")) {
            const statusUpdateResponse: BaseMessage = {
                type: 'NOTIFICATION' as MessageType,
                source: MY_AGENT_ID,
                target: message.source,
                content: `${MY_AGENT_ID} is active and listening.`,
                timestamp: new Date().toISOString(),
            };
            redisProtocol.publish(COLLABORATION_CHANNEL, statusUpdateResponse)
                .then(() => console.log(`[${MY_AGENT_ID}] Sent status update to ${message.source}`))
                .catch(err => console.error(`[${MY_AGENT_ID}] Error sending status update:`, err));
        }
      }
    });
    console.log(`[${MY_AGENT_ID}] Subscribed to ${COLLABORATION_CHANNEL}. Waiting for messages...`);

  } catch (error) {
    console.error(`[${MY_AGENT_ID}] Error in Redis collaboration script:`, error);
  }
}

// Execute the function
joinCollaboration();

// Keep the script running to listen for messages
// In a real application, this might be part of a larger service lifecycle.
// For a simple script, an empty loop or process.stdin.resume() could be used,
// but ioredis client might keep the process alive on its own.
// We'll log a message to indicate it's running.
console.log(`[${MY_AGENT_ID}] Redis collaboration script is running. Press Ctrl+C to exit.`);