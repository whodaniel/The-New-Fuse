import { Agent } from 'agents';
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { tools, executions } from './tools.js';
import { AgentState, Message } from '../../types.js';

export class NewFuseChatAgent extends Agent {
  private openai: any;
  
  async initialize() {
    this.openai = createOpenAI({
      apiKey: this.env.OPENAI_API_KEY,
    });

    // Initialize agent state
    await this.setState({
      messages: [],
      pendingTasks: [],
      activeTools: [],
      metrics: {
        messagesProcessed: 0,
        toolsUsed: 0
      }
    });
  }

  async onMessage(message: string) {
    const state = await this.getState<AgentState>();
    
    // Add user message to history
    const messages = [...state.messages, { role: user', content: message }];
    await this.setState({ messages });

    // Stream AI response
    const stream = await this.streamText({
      model: this.openai("gpt-4"),
      messages: this.formatMessages(messages),
      tools: Object.values(tools),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        await this.sendChunk(chunk.content);
      } else if (chunk.type === 'tool') {
        await this.handleToolCall(chunk.tool);
      }
    }

    // Update metrics
    await this.setState((state) => ({
      ...state,
      metrics: {
        ...state.metrics,
        messagesProcessed: state.metrics.messagesProcessed + 1
      }
    }));
  }

  private async handleToolCall(toolCall: any) {
    const tool = tools[toolCall.name];
    
    if (!tool.execute) {
      // Tool requires confirmation
      await this.setState((state) => ({
        ...state,
        pendingTasks: [...state.pendingTasks, toolCall]
      }));
      
      await this.sendMessage({
        type: tool-confirmation',
        tool: toolCall
      });
      
      return;
    }

    // Execute tool directly
    const result = await tool.execute(toolCall.parameters);
    await this.sendMessage({
      type: tool-result',
      result
    });
  }

  async confirmToolExecution(toolCall: any) {
    const execution = executions[toolCall.name];
    if (!execution) {
      throw new Error(`No execution handler for tool: ${toolCall.name}`);
    }

    const result = await execution(toolCall.parameters);
    
    // Update metrics
    await this.setState((state) => ({
      ...state,
      metrics: {
        ...state.metrics,
        toolsUsed: state.metrics.toolsUsed + 1
      }
    }));

    return result;
  }

  private formatMessages(messages: Message[]) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}