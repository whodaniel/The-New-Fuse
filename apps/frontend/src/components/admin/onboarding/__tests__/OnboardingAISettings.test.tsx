import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { OnboardingAISettings } from '../OnboardingAISettings.js';
import { OnboardingAdminService } from '../../../../services/onboarding-admin.service.js';

// Mock the service
jest.mock('../../../../services/onboarding-admin.service');

const mockAISettings = {
  // RAG Settings
  ragEnabled: true,
  defaultEmbeddingModel: 'text-embedding-3-large',
  vectorDatabaseType: 'pinecone',
  vectorDatabaseConfig: {
    pineconeApiKey: 'test-api-key',
    pineconeEnvironment: 'test-env',
    pineconeIndex: 'onboarding-knowledge'
  },
  
  // LLM Settings
  defaultLLMProvider: 'openai',
  defaultLLMModel: 'gpt-4',
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000,
  
  // Greeter Agent Settings
  greeterAgentEnabled: true,
  greeterAgentName: 'Fuse Assistant',
  greeterAgentAvatar: '/assets/images/greeter-avatar.png',
  greeterAgentPrompt: 'You are Fuse Assistant, a helpful AI assistant designed to help users get started with The New Fuse platform.',
  greeterAgentKnowledgeBase: [
    {
      id: 'kb-1',
      name: 'Platform Overview',
      description: 'General information about The New Fuse platform',
      enabled: true
    }
  ],
  
  // Multimodal Settings
  multimodalEnabled: true,
  supportedModalities: ['text', 'image'],
  imageAnalysisModel: 'gpt-4-vision',
  audioTranscriptionModel: 'whisper-large-v3',
  
  // Advanced Settings
  enableDebugMode: false,
  logUserInteractions: true,
  maxConcurrentRequests: 5,
  requestTimeout: 30,
  fallbackBehavior: 'graceful-degradation'
};

describe('OnboardingAISettings', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    (OnboardingAdminService.getAISettings as jest.Mock).mockResolvedValue(mockAISettings);
    (OnboardingAdminService.updateAISettings as jest.Mock).mockResolvedValue({ success: true });
  });

  it('renders loading state initially', () => {
    render(
      <ChakraProvider>
        <OnboardingAISettings 
          onSave={jest.fn()} 
          onChange={jest.fn()} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    expect(screen.getByText('Loading AI settings...')).toBeInTheDocument();
  });

  it('renders AI settings after loading', async () => {
    render(
      <ChakraProvider>
        <OnboardingAISettings 
          onSave={jest.fn()} 
          onChange={jest.fn()} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading AI settings...')).not.toBeInTheDocument();
    });
    
    // Check if tabs are rendered
    expect(screen.getByText('RAG Settings')).toBeInTheDocument();
    expect(screen.getByText('LLM Settings')).toBeInTheDocument();
    expect(screen.getByText('Greeter Agent')).toBeInTheDocument();
  });

  it('allows changing settings', async () => {
    const handleChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OnboardingAISettings 
          onSave={jest.fn()} 
          onChange={handleChange} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading AI settings...')).not.toBeInTheDocument();
    });
    
    // Find and toggle RAG enabled switch
    const ragEnabledSwitch = screen.getByLabelText('Enable RAG');
    fireEvent.click(ragEnabledSwitch);
    
    // Check if onChange was called
    expect(handleChange).toHaveBeenCalled();
  });

  it('saves changes when save button is clicked', async () => {
    const handleSave = jest.fn();
    
    render(
      <ChakraProvider>
        <OnboardingAISettings 
          onSave={handleSave} 
          onChange={jest.fn()} 
          hasUnsavedChanges={true} 
        />
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading AI settings...')).not.toBeInTheDocument();
    });
    
    // Click save button
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check if service method was called
    await waitFor(() => {
      expect(OnboardingAdminService.updateAISettings).toHaveBeenCalled();
    });
    
    // Check if onSave was called
    expect(handleSave).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    // Setup error mock
    (OnboardingAdminService.getAISettings as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(
      <ChakraProvider>
        <OnboardingAISettings 
          onSave={jest.fn()} 
          onChange={jest.fn()} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Settings')).toBeInTheDocument();
    });
    
    // Check if retry button is present
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
