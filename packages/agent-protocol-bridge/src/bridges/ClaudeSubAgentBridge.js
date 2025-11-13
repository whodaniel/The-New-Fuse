"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeSubAgentBridgeImplementation = void 0;
const axios_1 = __importDefault(require("axios"));
const claude_subagent_types_1 = require("../integrations/claude-subagent-types");
// Simple in-memory stores
const taskStore = new Map();
const subAgentStore = new Map();
const terminalSessionStore = new Map();
class ClaudeSubAgentBridgeImplementation {
    config;
    anthropicApiUrl = 'https://api.anthropic.com/v1/messages';
    constructor(config) {
        this.config = config;
    }
    async createSubAgent(config) {
        console.log('Creating Claude sub-agent with config:', config);
        const subAgent = {
            id: `claude-sub-agent-${Date.now()},
      status: 'IDLE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...config,
    };
    subAgentStore.set(subAgent.id, subAgent);
    return subAgent;
  }

  async delegateTask(subAgentId: string, task: Omit<ClaudeTask, 'id' | 'subAgentId' | 'status' | 'createdAt' | 'conversation' | 'toolCalls' | 'terminalSessions'>): Promise<ClaudeTask> {`,
            console, : .log(`Delegating task to sub-agent ${subAgentId}`, task),
            const: delegatedTask, ClaudeTask: claude_subagent_types_1.ClaudeTask = {
                id: claude - task - $
            }
        }, { Date, now };
        ();
    }
    subAgentId;
    status;
    conversation;
    toolCalls;
    terminalSessions;
    createdAt;
    task;
}
exports.ClaudeSubAgentBridgeImplementation = ClaudeSubAgentBridgeImplementation;
;
taskStore.set(delegatedTask.id, delegatedTask);
try {
    const response = await axios_1.default.post(this.anthropicApiUrl, {
        model: this.config.defaultModel || 'claude-3-opus-20240229',
        max_tokens: this.config.maxTokens || 1024,
        messages: [{ role: 'user', content: task.goal }],
    }, {
        headers: {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
    });
    const assistantMessage = {} `
        id: claude-message-${Date.now()}`, role, content, timestamp;
    (),
    ;
}
finally { }
;
delegatedTask.conversation.push({
    id: user - message - $
}, { Date, : .now() }, role, 'user', content, [{ type: 'text', text: task.goal }], timestamp, delegatedTask.createdAt);
delegatedTask.conversation.push(assistantMessage);
const toolUseBlocks = response.data.content.filter((block) => block.type === 'tool_use');
if (toolUseBlocks.length > 0) {
    delegatedTask.status = claude_subagent_types_1.ClaudeTaskStatus.AWAITING_APPROVAL;
    delegatedTask.toolCalls = toolUseBlocks.map((block) => ({
        id: block.id,
        toolUseId: block.id,
        toolName: block.name,
        input: block.input,
        status: 'pending',
        timestamp: new Date(),
    }));
}
else {
    delegatedTask.status = claude_subagent_types_1.ClaudeTaskStatus.COMPLETED;
    delegatedTask.result = response.data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
}
delegatedTask.completedAt = new Date();
taskStore.set(delegatedTask.id, delegatedTask);
return delegatedTask;
try { }
catch (error) {
    console.error('Error delegating task to Claude:', error);
    delegatedTask.status = claude_subagent_types_1.ClaudeTaskStatus.FAILED;
    delegatedTask.error = error.message;
    taskStore.set(delegatedTask.id, delegatedTask);
    throw error;
}
`
`;
async;
getTaskStatus(taskId, string);
Promise < { status: claude_subagent_types_1.ClaudeTaskStatus, history: claude_subagent_types_1.ClaudeMessage[] } > {
    console, : .log(Getting, status), for: task, $
};
{
    taskId;
}
`);
    const task = taskStore.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return {
      status: task.status,
      history: task.conversation,
    };
  }

  async provideToolOutput(taskId: string, toolCallId: string, output: any): Promise<void> {
    console.log(Providing tool output for task ${taskId}, tool call ${toolCallId}`;
output;
;
const task = taskStore.get(taskId);
if (!task) {
    throw new Error('Task not found');
}
const toolCall = task.toolCalls.find((tc) => tc.toolUseId === toolCallId);
if (!toolCall) {
    throw new Error('Tool call not found');
}
toolCall.output = output;
toolCall.status = 'success';
const toolResultMessage = {
    id: user - message - $
}, { Date, now };
();
role: 'user',
    content;
[
    {
        type: 'tool_result',
        tool_use_id: toolCallId,
        content: output,
    },
],
    timestamp;
new Date(),
;
;
task.conversation.push(toolResultMessage);
try {
    const response = await axios_1.default.post(this.anthropicApiUrl, {
        model: this.config.defaultModel || 'claude-3-opus-20240229',
        max_tokens: this.config.maxTokens || 1024,
        messages: task.conversation.map((m) => ({ role: m.role, content: m.content })),
    }, {
        headers: {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
    });
    const assistantMessage = {} `
        id: claude-message-${Date.now()}`, role, content, timestamp;
    (),
    ;
}
finally { }
;
task.conversation.push(assistantMessage);
const toolUseBlocks = response.data.content.filter((block) => block.type === 'tool_use');
if (toolUseBlocks.length > 0) {
    task.status = claude_subagent_types_1.ClaudeTaskStatus.AWAITING_APPROVAL;
    task.toolCalls.push(...toolUseBlocks.map((block) => ({
        id: block.id,
        toolUseId: block.id,
        toolName: block.name,
        input: block.input,
        status: 'pending',
        timestamp: new Date(),
    })));
}
else {
    task.status = claude_subagent_types_1.ClaudeTaskStatus.COMPLETED;
    task.result = response.data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
}
task.completedAt = new Date();
taskStore.set(task.id, task);
try { }
catch (error) {
    console.error('Error providing tool output to Claude:', error);
    task.status = claude_subagent_types_1.ClaudeTaskStatus.FAILED;
    task.error = error.message;
    taskStore.set(task.id, task);
    throw error;
}
async;
sendTerminalCommand(sessionId, string, command, string);
Promise < claude_subagent_types_1.ClaudeTerminalInteraction > {
    console, : .log(Sending, terminal, command, to, session, $, { sessionId } `:, command);
    let session = terminalSessionStore.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        taskId: 'unknown',
        status: 'active',
        history: [],
        createdAt: new Date(),
      };
      terminalSessionStore.set(sessionId, session);
    }

    const interaction: ClaudeTerminalInteraction = {
      id: terminal-interaction-${Date.now()},
      type: 'command',
      content: command,
      timestamp: new Date(),
    };
    session.history.push(interaction);

    // Simulate command output
    const outputInteraction: ClaudeTerminalInteraction = {`, id, terminal - interaction - $, { Date, : .now() + 1 } `,
      type: 'output',
      content: Output for command: ${command}`, timestamp, new Date())
};
session.history.push(outputInteraction);
return Promise.resolve(outputInteraction);
async;
provideTerminalInput(sessionId, string, input, string);
Promise < void  > {
    console, : .log(Providing, terminal, input, to, session, $, { sessionId }, input),
    const: session = terminalSessionStore.get(sessionId),
    if(, session) {
        throw new Error('Session not found');
    },
    const: interaction, ClaudeTerminalInteraction: claude_subagent_types_1.ClaudeTerminalInteraction = {} `
      id: terminal-interaction-${Date.now()}` `,
      type: 'input_request',
      content: input,
      timestamp: new Date(),
    };
    session.history.push(interaction);
    return Promise.resolve();
  }
}
};
//# sourceMappingURL=ClaudeSubAgentBridge.js.map