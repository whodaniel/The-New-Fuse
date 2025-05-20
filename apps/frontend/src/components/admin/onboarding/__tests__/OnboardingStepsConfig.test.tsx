import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { OnboardingStepsConfig } from '../OnboardingStepsConfig.js';
import { OnboardingAdminService } from '../../../../services/onboarding-admin.service.js';

// Mock the service
jest.mock('../../../../services/onboarding-admin.service');

const mockSteps = [
  {
    id: '1',
    type: 'welcome',
    title: 'Welcome',
    description: 'Introduction to The New Fuse platform',
    enabled: true,
    required: true,
    userTypes: ['human', 'ai_agent'],
    content: {
      heading: 'Welcome to The New Fuse',
      subheading: 'The AI agent coordination platform that enables intelligent interaction between different AI systems.',
      imageUrl: '/assets/images/welcome.png',
      buttonText: 'Get Started'
    }
  },
  {
    id: '2',
    type: 'completion',
    title: 'Complete',
    description: 'Onboarding completion',
    enabled: true,
    required: true,
    userTypes: ['human', 'ai_agent'],
    content: {
      heading: 'All Set!',
      subheading: 'You\'re ready to start using The New Fuse.',
      buttonText: 'Get Started'
    }
  }
];

describe('OnboardingStepsConfig', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    (OnboardingAdminService.getSteps as jest.Mock).mockResolvedValue(mockSteps);
    (OnboardingAdminService.updateSteps as jest.Mock).mockResolvedValue({ success: true });
  });

  it('renders loading state initially', () => {
    render(
      <ChakraProvider>
        <OnboardingStepsConfig 
          onSave={jest.fn()} 
          onChange={jest.fn()} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    expect(screen.getByText('Loading onboarding steps...')).toBeInTheDocument();
  });

  it('renders steps after loading', async () => {
    render(
      <ChakraProvider>
        <OnboardingStepsConfig 
          onSave={jest.fn()} 
          onChange={jest.fn()} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading onboarding steps...')).not.toBeInTheDocument();
    });
    
    // Check if steps are rendered
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('allows adding a new step', async () => {
    const handleChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OnboardingStepsConfig 
          onSave={jest.fn()} 
          onChange={handleChange} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading onboarding steps...')).not.toBeInTheDocument();
    });
    
    // Click add step button
    fireEvent.click(screen.getByText('Add Step'));
    
    // Check if modal is open
    expect(screen.getByText('Add New Step')).toBeInTheDocument();
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Test Step' } });
    
    // Save the step
    fireEvent.click(screen.getByText('Add Step'));
    
    // Check if onChange was called
    expect(handleChange).toHaveBeenCalled();
  });

  it('saves changes when save button is clicked', async () => {
    const handleSave = jest.fn();
    
    render(
      <ChakraProvider>
        <OnboardingStepsConfig 
          onSave={handleSave} 
          onChange={jest.fn()} 
          hasUnsavedChanges={true} 
        />
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading onboarding steps...')).not.toBeInTheDocument();
    });
    
    // Click save button
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check if service method was called
    await waitFor(() => {
      expect(OnboardingAdminService.updateSteps).toHaveBeenCalled();
    });
    
    // Check if onSave was called
    expect(handleSave).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    // Setup error mock
    (OnboardingAdminService.getSteps as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(
      <ChakraProvider>
        <OnboardingStepsConfig 
          onSave={jest.fn()} 
          onChange={jest.fn()} 
          hasUnsavedChanges={false} 
        />
      </ChakraProvider>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Steps')).toBeInTheDocument();
    });
    
    // Check if retry button is present
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
