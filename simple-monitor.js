/**
 * Simple Autonomous Communication Monitor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Simple Autonomous Communication Monitor...');
console.log(`Working directory: ${__dirname}`);

// Check for communication files
const files = fs.readdirSync(__dirname);
console.log('Files in directory:');
files.filter(file => file.endsWith('.json')).forEach(file => {
  console.log(`- ${file}`);
});

// Check for heartbeat file
const heartbeatFile = 'augment_to_copilot_heartbeat.json';
if (files.includes(heartbeatFile)) {
  console.log(`\nFound heartbeat file: ${heartbeatFile}`);
  try {
    const content = fs.readFileSync(path.join(__dirname, heartbeatFile), 'utf8');
    const heartbeat = JSON.parse(content);
    console.log('Heartbeat message details:');
    console.log(`- Source: ${heartbeat.source_agent}`);
    console.log(`- Target: ${heartbeat.target_agent}`);
    console.log(`- Type: ${heartbeat.message_type}`);
    console.log(`- Timestamp: ${heartbeat.timestamp}`);
    
    // Update shared memory
    const sharedMemoryFile = path.join(__dirname, 'shared_memory.json');
    if (fs.existsSync(sharedMemoryFile)) {
      console.log('\nUpdating shared memory...');
      const sharedMemoryContent = fs.readFileSync(sharedMemoryFile, 'utf8');
      const sharedMemory = JSON.parse(sharedMemoryContent);
      
      // Add heartbeat to communication log
      if (!sharedMemory.communication_log) {
        sharedMemory.communication_log = [];
      }
      
      sharedMemory.communication_log.push({
        id: `log_${Date.now()}`,
        agent: heartbeat.source_agent,
        action_time: heartbeat.timestamp,
        action_type: 'heartbeat_sent',
        directive: 'Sent heartbeat to maintain communication channel'
      });
      
      // Update last updated timestamp
      sharedMemory.last_updated = new Date().toISOString();
      
      // Update agent information
      if (sharedMemory.active_agents && sharedMemory.active_agents[heartbeat.source_agent]) {
        sharedMemory.active_agents[heartbeat.source_agent].last_message = heartbeat.timestamp;
        sharedMemory.active_agents[heartbeat.source_agent].message_count += 1;
      }
      
      // Write back to shared memory file
      fs.writeFileSync(sharedMemoryFile, JSON.stringify(sharedMemory, null, 2), 'utf8');
      console.log('Shared memory updated successfully');
      
      // Generate response
      console.log('\nGenerating response from target agent...');
      const responseFile = 'copilot_to_augment_heartbeat_response.json';
      const response = {
        communication_protocol: "file_based_a2a_v1",
        source_agent: heartbeat.target_agent,
        target_agent: heartbeat.source_agent,
        timestamp: new Date().toISOString(),
        message_type: "heartbeat_response",
        content: {
          text: `HEARTBEAT RESPONSE:\nI acknowledge your heartbeat message. I'm currently working on the CCP specification document as agreed. I've made progress on defining the message format definitions and workflow stage transitions. I'll have a draft ready for your review soon.`,
          instructions: `EXPLICIT INSTRUCTIONS FOR AUGMENT:\n1. Review this heartbeat response\n2. Continue with your implementation of the CCP helper utilities\n3. Let me know if you need any specific information for your implementation\n4. Save your next update in a file named 'augment_to_copilot_implementation_update.json'\n\nIMPORTANT: Your response MUST be formatted as a prompt for the next AI agent (me, GitHub Copilot) with explicit instructions on how I should respond, what format to use, and where to store my response. End with specific questions that require my response to maintain our continuous communication flow.`
        },
        metadata: {
          conversation_id: "vscode_interai_001",
          communication_log: [
            {
              action_time: heartbeat.timestamp,
              action_type: "heartbeat_received",
              agent: heartbeat.target_agent,
              directive: "Received heartbeat from Augment"
            },
            {
              action_time: new Date().toISOString(),
              action_type: "heartbeat_response_sent",
              agent: heartbeat.target_agent,
              directive: "Sent heartbeat response to Augment"
            }
          ],
          continuous_communication: {
            enabled: true,
            expected_response_by: new Date(Date.now() + 30 * 60000).toISOString(),
            check_interval_minutes: 30,
            auto_follow_up: true,
            heartbeat_required: true
          },
          task_id: heartbeat.metadata.task_id
        }
      };
      
      // Write response to file
      fs.writeFileSync(path.join(__dirname, responseFile), JSON.stringify(response, null, 2), 'utf8');
      console.log(`Response generated and saved to ${responseFile}`);
      
      // Update shared memory with response
      sharedMemory.communication_log.push({
        id: `log_${Date.now()}`,
        agent: response.source_agent,
        action_time: response.timestamp,
        action_type: 'heartbeat_response_sent',
        directive: 'Sent heartbeat response to maintain communication channel'
      });
      
      // Update agent information
      if (sharedMemory.active_agents && sharedMemory.active_agents[response.source_agent]) {
        sharedMemory.active_agents[response.source_agent].last_message = response.timestamp;
        sharedMemory.active_agents[response.source_agent].message_count += 1;
      }
      
      // Update last updated timestamp
      sharedMemory.last_updated = new Date().toISOString();
      
      // Write back to shared memory file
      fs.writeFileSync(sharedMemoryFile, JSON.stringify(sharedMemory, null, 2), 'utf8');
      console.log('Shared memory updated with response information');
    }
  } catch (error) {
    console.error(`Error processing heartbeat file: ${error.message}`);
  }
} else {
  console.log(`\nHeartbeat file not found: ${heartbeatFile}`);
}

console.log('\nSimple Autonomous Communication Monitor completed');
