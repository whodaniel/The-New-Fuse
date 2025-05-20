/**
 * Tests for the AgentRegistry service
 * 
 * These tests validate the agent registration, discovery, and management
 * functionality provided by the AgentRegistry service.
 */

import { AgentRegistry, AgentType, AgentStatus } from '../services/AgentRegistry.js';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  
  beforeEach(() => {
    registry = new AgentRegistry({ debug: true });
  });
  
  test('should register an agent successfully', () => {
    // Arrange
    const agent = {
      id: 'test-agent-1',
      name: 'Test Agent',
      type: AgentType.LLM,
      status: AgentStatus.ACTIVE,
      capabilities: ['code_generation', 'debugging'],
      metadata: {
        version: '1.0.0',
        provider: 'OpenAI'
      }
    };
    
    // Act
    const result = registry.registerAgent(agent);
    
    // Assert
    expect(result).toEqual(agent);
    expect(registry.getAgent('test-agent-1')).toEqual(agent);
  });
  
  test('should throw error when registering agent with invalid data', () => {
    // Arrange
    const invalidAgent = {
      id: 'test-agent-2',
      name: '', // Empty name (invalid)
      type: AgentType.LLM,
      status: AgentStatus.ACTIVE,
      capabilities: ['code_generation'],
      metadata: {}
    };
    
    // Act & Assert
    expect(() => registry.registerAgent(invalidAgent)).toThrow('Agent name is required');
  });
  
  test('should update an existing agent', () => {
    // Arrange
    const agent = {
      id: 'test-agent-3',
      name: 'Original Name',
      type: AgentType.TOOL,
      status: AgentStatus.ACTIVE,
      capabilities: ['data_analysis'],
      metadata: { version: '1.0.0' }
    };
    
    // Register original agent
    registry.registerAgent(agent);
    
    // Act
    const updatedAgent = registry.updateAgent('test-agent-3', {
      name: 'Updated Name',
      status: AgentStatus.BUSY,
      metadata: { version: '1.0.1', updated: true }
    });
    
    // Assert
    expect(updatedAgent.name).toBe('Updated Name');
    expect(updatedAgent.status).toBe(AgentStatus.BUSY);
    expect(updatedAgent.type).toBe(AgentType.TOOL); // Unchanged
    expect(updatedAgent.capabilities).toEqual(['data_analysis']); // Unchanged
    expect(updatedAgent.metadata).toEqual({ version: '1.0.1', updated: true });
  });
  
  test('should throw error when updating non-existent agent', () => {
    // Act & Assert
    expect(() => registry.updateAgent('non-existent', { 
      name: 'New Name' 
    })).toThrow('Agent with ID non-existent not found');
  });
  
  test('should remove an agent', () => {
    // Arrange
    const agent = {
      id: 'test-agent-4',
      name: 'Agent to Remove',
      type: AgentType.ANALYSIS,
      status: AgentStatus.ACTIVE,
      capabilities: ['text_analysis'],
      metadata: {}
    };
    
    // Register the agent
    registry.registerAgent(agent);
    
    // Act
    const result = registry.removeAgent('test-agent-4');
    
    // Assert
    expect(result).toBe(true);
    expect(registry.getAgent('test-agent-4')).toBeUndefined();
  });
  
  test('should return false when removing non-existent agent', () => {
    // Act
    const result = registry.removeAgent('non-existent');
    
    // Assert
    expect(result).toBe(false);
  });
  
  test('should find agents by criteria', () => {
    // Arrange
    const agents = [
      {
        id: 'agent-1',
        name: 'Agent One',
        type: AgentType.LLM,
        status: AgentStatus.ACTIVE,
        capabilities: ['text_generation', 'translation'],
        metadata: { source: 'OpenAI' }
      },
      {
        id: 'agent-2',
        name: 'Agent Two',
        type: AgentType.TOOL,
        status: AgentStatus.ACTIVE,
        capabilities: ['data_analysis', 'visualization'],
        metadata: { source: 'Local' }
      },
      {
        id: 'agent-3',
        name: 'Agent Three',
        type: AgentType.LLM,
        status: AgentStatus.INACTIVE,
        capabilities: ['code_generation', 'debugging'],
        metadata: { source: 'Anthropic' }
      }
    ];
    
    // Register all agents
    agents.forEach(agent => registry.registerAgent(agent));
    
    // Act & Assert
    
    // Find by type
    const llmAgents = registry.findAgents({ type: AgentType.LLM });
    expect(llmAgents.length).toBe(2);
    expect(llmAgents.map(a => a.id)).toContain('agent-1');
    expect(llmAgents.map(a => a.id)).toContain('agent-3');
    
    // Find by status
    const activeAgents = registry.findAgents({ status: AgentStatus.ACTIVE });
    expect(activeAgents.length).toBe(2);
    expect(activeAgents.map(a => a.id)).toContain('agent-1');
    expect(activeAgents.map(a => a.id)).toContain('agent-2');
    
    // Find by type and status
    const activeLLMs = registry.findAgents({ 
      type: AgentType.LLM, 
      status: AgentStatus.ACTIVE 
    });
    expect(activeLLMs.length).toBe(1);
    expect(activeLLMs[0].id).toBe('agent-1');
    
    // Find by metadata
    const openAIAgents = registry.findAgents({ 
      metadata: { source: 'OpenAI' } 
    });
    expect(openAIAgents.length).toBe(1);
    expect(openAIAgents[0].id).toBe('agent-1');
  });
  
  test('should find agents by capability', () => {
    // Arrange
    const agents = [
      {
        id: 'agent-a',
        name: 'Agent A',
        type: AgentType.LLM,
        status: AgentStatus.ACTIVE,
        capabilities: ['text_generation', 'translation'],
        metadata: {}
      },
      {
        id: 'agent-b',
        name: 'Agent B',
        type: AgentType.TOOL,
        status: AgentStatus.ACTIVE,
        capabilities: ['data_analysis', 'translation'],
        metadata: {}
      },
      {
        id: 'agent-c',
        name: 'Agent C',
        type: AgentType.ANALYSIS,
        status: AgentStatus.ACTIVE,
        capabilities: ['data_analysis', 'visualization'],
        metadata: {}
      }
    ];
    
    // Register all agents
    agents.forEach(agent => registry.registerAgent(agent));
    
    // Act & Assert
    
    // Find agents with translation capability
    const translators = registry.findAgentsByCapability('translation');
    expect(translators.length).toBe(2);
    expect(translators.map(a => a.id)).toContain('agent-a');
    expect(translators.map(a => a.id)).toContain('agent-b');
    
    // Find agents with data_analysis capability
    const dataAnalysts = registry.findAgentsByCapability('data_analysis');
    expect(dataAnalysts.length).toBe(2);
    expect(dataAnalysts.map(a => a.id)).toContain('agent-b');
    expect(dataAnalysts.map(a => a.id)).toContain('agent-c');
    
    // Find agents with non-existent capability
    const nonExistent = registry.findAgentsByCapability('non_existent');
    expect(nonExistent.length).toBe(0);
  });
  
  test('should register agent capabilities', () => {
    // Arrange
    const agent = {
      id: 'agent-caps',
      name: 'Capability Agent',
      type: AgentType.LLM,
      status: AgentStatus.ACTIVE,
      capabilities: ['text_generation'],
      metadata: {}
    };
    
    // Register agent
    registry.registerAgent(agent);
    
    // Act
    const updatedAgent = registry.registerAgentCapabilities('agent-caps', [
      'translation', 'summarization'
    ]);
    
    // Assert
    expect(updatedAgent.capabilities).toHaveLength(3);
    expect(updatedAgent.capabilities).toContain('text_generation');
    expect(updatedAgent.capabilities).toContain('translation');
    expect(updatedAgent.capabilities).toContain('summarization');
    
    // Should dedup capabilities
    const dedupedAgent = registry.registerAgentCapabilities('agent-caps', [
      'translation', 'code_generation'
    ]);
    
    expect(dedupedAgent.capabilities).toHaveLength(4);
    expect(dedupedAgent.capabilities).toContain('text_generation');
    expect(dedupedAgent.capabilities).toContain('translation');
    expect(dedupedAgent.capabilities).toContain('summarization');
    expect(dedupedAgent.capabilities).toContain('code_generation');
  });
});