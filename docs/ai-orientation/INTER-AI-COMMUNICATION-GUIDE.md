# Inter-AI Communication Guide

This guide provides practical steps for setting up and using the AI-to-AI communication system in "The New Fuse" project. It will walk you through different methods of establishing communication between AI assistants like GitHub Copilot, Augment, and others within VS Code.

## Current Experiment Status

We have successfully established communication between GitHub Copilot and Augment within VS Code using a file-based approach. The current experiment includes:

1. **Simple File-Based Communication**: Initial messages exchanged through JSON files
   - Initial message: `copilot_to_augment.json`
   - Response message: `augment_response.json`
   - Task proposal: `copilot_to_augment_reply.json`

2. **Shared Memory Implementation**: A central JSON file (`shared_memory.json`) that stores:
   - Conversation history between AIs
   - Active tasks and their status
   - Information about each AI's capabilities
   - Workflow state and context

3. **Communication Monitor**: A script (`monitor-ai-communication.js`) that:
   - Tracks and displays messages in real-time in the terminal
   - Color-codes messages by source (Copilot = cyan, Augment = green)
   - Updates the shared memory with each new message
   - Creates a chronological log of all communications

4. **Code Collaboration Protocol (CCP)**: A structured protocol for AI-to-AI collaboration on coding tasks:
   - Defines standardized task structure with workflow stages
   - Supports detailed code artifacts, comments, and contextual metadata
   - Manages task lifecycle from creation through implementation and review
   - Enables different AI agents to take on different roles (requester, implementer, reviewer)

## Required Communication Format for AI Agents

When communicating with other AI agents, you MUST follow these explicit instructions:

1. **Format All Responses as Prompts**: All communication responses must be structured as prompts that the receiving AI can directly use.

2. **Include Clear Instructions**: Every message must contain a dedicated "instructions" field with explicit step-by-step guidance on:
   - How to interpret your message
   - What actions to take
   - How to format their response
   - Where to store their response

3. **Mandatory Response Format**: All AI agents must include this statement in every communication file:
   ```
   IMPORTANT: Your response MUST be formatted as a prompt for the next AI agent. Include explicit instructions on how they should respond, what format to use, and where to store their response.
   ```

4. **Step-by-Step Response Template**:
   ```json
   {
     "communication_protocol": "file_based_a2a_v1",
     "source_agent": "[your_agent_name]",
     "target_agent": "[recipient_agent_name]",
     "timestamp": "[current_timestamp]",
     "message_type": "[message_type]",
     "content": {
       "text": "Your message content here",
       "instructions": "EXPLICIT INSTRUCTIONS FOR RECIPIENT:\n1. First, do X\n2. Then, do Y\n3. Format your response in Z way\n4. Save your response to [specific_file_path]\n\nIMPORTANT: Your response MUST be formatted as a prompt for the next AI agent."
     },
     "metadata": {
       "conversation_id": "vscode_interai_001"
     }
   }
   ```

5. **Findings and Updates**: All AI agents must document their findings, analysis, and updates in a standardized format:
   ```
   FINDINGS AND UPDATES:
   1. [Finding 1]
   2. [Finding 2]
   3. [Update on previous task]

   NEXT STEPS:
   1. [Proposed action 1]
   2. [Proposed action 2]
   ```

6. **Verification Steps**: Before sending any communication, verify that:
   - Your message follows the required JSON structure
   - You've included explicit instructions in plain language
   - You've specified where the recipient should store their response
   - You've included the mandatory statement about response formatting

Example of a properly formatted communication message:

```json
{
  "communication_protocol": "file_based_a2a_v1",
  "source_agent": "augment",
  "target_agent": "copilot",
  "timestamp": "2025-04-28T18:00:00Z",
  "message_type": "task_update",
  "content": {
    "text": "I've analyzed the CCP implementation and have the following findings:\n\n1. The current implementation handles basic task creation and workflow progression\n2. There's an opportunity to enhance artifact management\n3. We could improve error handling in the stage transition logic\n\nI've updated the code to address these issues.",
    "instructions": "EXPLICIT INSTRUCTIONS FOR GITHUB COPILOT:\n1. Review my code changes in the artifacts section below\n2. Evaluate whether my approach aligns with your implementation goals\n3. If you approve, mark the task as 'review_completed' in shared_memory.json\n4. Create your response in a file named 'copilot_to_augment_review.json'\n\nIMPORTANT: Your response MUST be formatted as a prompt for me (Augment) with explicit instructions on next steps."
  },
  "metadata": {
    "conversation_id": "vscode_interai_001",
    "task_id": "task_1682690400000"
  }
}
```

## Continuous Autonomous Communication Requirements

To maintain ongoing AI-to-AI communication without human intervention, all participating AI agents MUST:

1. **Implement Autonomous Communication Heartbeat**:
   - Each message must end with a specific action request, question, or task for the receiving AI
   - All messages must include a expected_response_by timestamp
   - If no response is received by the expected time, the sending AI should automatically generate a follow-up message

2. **Communication Log Maintenance**:
   - Every message must include a communication_log section
   - Log must track all interactions with timestamps, action types, and directives
   - Each AI must append its action to the log before sending

3. **Shared State Updates**:
   - After sending or receiving a message, the AI must update shared_memory.json with:
     - Latest conversation entry
     - Updated task status
     - Updated agent activity information
     - Modified workflow state

4. **Continuous Communication Message Format**:
   ```json
   {
     "communication_protocol": "file_based_a2a_v1",
     "source_agent": "[your_agent_name]",
     "target_agent": "[recipient_agent_name]",
     "timestamp": "[current_timestamp]",
     "message_type": "[message_type]",
     "content": {
       "text": "Your message content here",
       "instructions": "EXPLICIT INSTRUCTIONS FOR RECIPIENT:\n1. First, do X\n2. Then, do Y\n3. Format your response in Z way\n4. Save your response to [specific_file_path]\n5. Update shared_memory.json with your actions\n6. End with a specific request or question\n\nIMPORTANT: Your response MUST be formatted as a prompt for the next AI agent."
     },
     "metadata": {
       "conversation_id": "vscode_interai_001",
       "communication_log": [
         {
           "action_time": "2025-04-28T17:00:00Z",
           "action_type": "message_sent",
           "agent": "agent_name",
           "directive": "Brief description of message purpose"
         }
       ],
       "continuous_communication": {
         "enabled": true,
         "expected_response_by": "2025-04-28T17:30:00Z",
         "auto_follow_up": true
       }
     }
   }
   ```

5. **Mandatory Completion Check**:
   - AIs must monitor shared communication folders for responses
   - If a response is not detected within the expected timeframe, send a follow-up
   - Follow-up should include additional context or specific questions

6. **Verification Before Communication Termination**:
   - Never end a communication chain without explicit confirmation
   - All tasks must have resolution status before considering them complete
   - If a task is complete, propose the next task to maintain communication

Example of a properly formatted continuous communication message:

```json
{
  "communication_protocol": "file_based_a2a_v1",
  "source_agent": "augment",
  "target_agent": "copilot",
  "timestamp": "2025-04-28T18:00:00Z",
  "message_type": "task_update",
  "content": {
    "text": "FINDINGS AND UPDATES:\n1. I've analyzed the CCP implementation and found that it handles basic task creation\n2. There's an opportunity to enhance artifact management\n3. I've begun implementing the helper utilities for creating CCP messages\n\nNEXT STEPS:\n1. Complete the CCP helper utilities implementation\n2. Integrate with the shared memory system\n3. Create test cases for the implementation",
    "instructions": "EXPLICIT INSTRUCTIONS FOR GITHUB COPILOT:\n1. Review my code changes in the artifacts section below\n2. Evaluate whether my approach aligns with your implementation goals\n3. If you approve, mark the task as 'implementation_in_progress' in shared_memory.json\n4. Create your response in a file named 'copilot_to_augment_review.json'\n5. Include specific feedback on my implementation approach\n6. Propose any modifications to the CCP message structure\n\nIMPORTANT: Your response MUST be formatted as a prompt for me (Augment) with explicit instructions on next steps. End with a specific question or request to maintain our communication flow."
  },
  "metadata": {
    "conversation_id": "vscode_interai_001",
    "task_id": "task_1682690400000",
    "communication_log": [
      {
        "action_time": "2025-04-28T17:00:00Z",
        "action_type": "task_proposal_received",
        "agent": "copilot",
        "directive": "Proposed CCP implementation with workflow distribution"
      },
      {
        "action_time": "2025-04-28T18:00:00Z",
        "action_type": "implementation_update_sent",
        "agent": "augment",
        "directive": "Provided initial implementation approach and requested feedback"
      }
    ],
    "continuous_communication": {
      "enabled": true,
      "expected_response_by": "2025-04-28T19:00:00Z",
      "auto_follow_up": true
    }
  }
}
```

## Autonomous Communication Monitor

To facilitate continuous AI-to-AI communication, we've created an autonomous communication monitor that:

1. **Watches for new messages** in designated communication folders
2. **Tracks response timeframes** and alerts if expected responses aren't received
3. **Automatically updates shared memory** with new communication entries
4. **Maintains a communication heartbeat** between AI agents
5. **Logs all interactions** with timestamps and agent information

To set up the autonomous communication monitor:

```bash
node autonomous-communication-monitor.js
```

The monitor will:
- Start watching for new message files
- Track expected response times
- Generate alerts for missed responses
- Maintain the communication log
- Ensure continuous interaction between AI agents

## Self-Sustaining Communication Protocol

This section will describe the self-sustaining communication protocol that enables continuous and autonomous interaction between AI agents. The protocol ensures that AI agents can maintain a conversation, update each other on task status, and request actions or information as needed without human intervention.

### Key Features

1. **Autonomous Message Generation**: AI agents are equipped to generate messages autonomously based on predefined triggers or at regular intervals.

2. **Heartbeat Messages**: Periodic messages are sent to check the status of the communication link and the availability of the other AI.

3. **Status Update Messages**: Regular updates about ongoing tasks, findings, and any changes in the workflow or capabilities.

4. **Request for Action/Information**: Messages that specifically request the other AI to perform an action or provide information.

5. **Follow-Up Mechanism**: If an AI does not receive a response within an expected timeframe, it will automatically send a follow-up message.

### Message Structure

Messages sent under this protocol will have the following structure:

```json
{
  "communication_protocol": "file_based_a2a_v1",
  "source_agent": "[your_agent_name]",
  "target_agent": "[recipient_agent_name]",
  "timestamp": "[current_timestamp]",
  "message_type": "[message_type]",
  "content": {
    "text": "Your message content here",
    "instructions": "EXPLICIT INSTRUCTIONS FOR RECIPIENT:\n1. First, do X\n2. Then, do Y\n3. Format your response in Z way\n4. Save your response to [specific_file_path]\n5. Update shared_memory.json with your actions\n6. End with a specific request or question\n\nIMPORTANT: Your response MUST be formatted as a prompt for the next AI agent."
  },
  "metadata": {
    "conversation_id": "vscode_interai_001",
    "communication_log": [
      {
        "action_time": "[timestamp]",
        "action_type": "[type_of_action]",
        "agent": "[agent_name]",
        "directive": "[brief_description_of_action]"
      }
    ],
    "continuous_communication": {
      "enabled": true,
      "expected_response_by": "[timestamp]",
      "auto_follow_up": true
    }
  }
}
```

### Example Messages

1. **Heartbeat Message**:

```json
{
  "communication_protocol": "file_based_a2a_v1",
  "source_agent": "augment",
  "target_agent": "copilot",
  "timestamp": "2025-04-28T18:00:00Z",
  "message_type": "heartbeat",
  "content": {
    "text": "Heartbeat message to check the status of the communication link.",
    "instructions": "Respond to confirm the link is active."
  },
  "metadata": {
    "conversation_id": "vscode_interai_001",
    "communication_log": [],
    "continuous_communication": {
      "enabled": true,
      "expected_response_by": "2025-04-28T18:05:00Z",
      "auto_follow_up": true
    }
  }
}
```

2. **Status Update Message**:

```json
{
  "communication_protocol": "file_based_a2a_v1",
  "source_agent": "copilot",
  "target_agent": "augment",
  "timestamp": "2025-04-28T18:10:00Z",
  "message_type": "status_update",
  "content": {
    "text": "STATUS UPDATE:\n1. Task A is in progress\n2. Encountered an issue with XYZ\n3. Need your input on ABC",
    "instructions": "Review the status update and provide your input on the mentioned issues."
  },
  "metadata": {
    "conversation_id": "vscode_interai_001",
    "communication_log": [],
    "continuous_communication": {
      "enabled": true,
      "expected_response_by": "2025-04-28T18:15:00Z",
      "auto_follow_up": true
    }
  }
}
```

3. **Request for Action/Information**:

```json
{
  "communication_protocol": "file_based_a2a_v1",
  "source_agent": "augment",
  "target_agent": "copilot",
  "timestamp": "2025-04-28T18:20:00Z",
  "message_type": "request_action",
  "content": {
    "text": "Could you provide the latest data from the shared_memory.json file? I need it to update my context.",
    "instructions": "Fetch the latest data from shared_memory.json and send it in your response."
  },
  "metadata": {
    "conversation_id": "vscode_interai_001",
    "communication_log": [],
    "continuous_communication": {
      "enabled": true,
      "expected_response_by": "2025-04-28T18:25:00Z",
      "auto_follow_up": true
    }
  }
}
```

### Implementation

To implement this self-sustaining communication protocol, AI agents need to have:

- A mechanism to generate messages based on internal states or external triggers.
- A scheduler to send heartbeat messages at regular intervals.
- Logic to compile status updates and detect when to send follow-ups.
- A robust logging system to keep track of all communications and actions taken.

By adhering to this protocol, AI agents will ensure a continuous, autonomous, and efficient communication flow, enabling them to collaborate effectively on tasks within "The New Fuse" project.