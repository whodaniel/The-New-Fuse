import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { OnboardingWizardPreview } from '../OnboardingWizardPreview.js';
import { OnboardingAdminService } from '../../../../services/onboarding-admin.service.js';
import { BrowserRouter } from 'react-router-dom';

// Mock the service
jest.mock('../../../../services/onboarding-admin.service');

// Mock the iframe
jest.mock('react-iframe', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-iframe">Mock iframe content</div>
}));

const mockValidationResult = {
  valid: true,
  status: 'success',
  message: 'Configuration is valid',
  details: []
};

describe('OnboardingWizardPreview', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    (OnboardingAdminService.validateConfiguration as jest.Mock).mockResolvedValue(mockValidationResult);
  });

  it('renders loading state initially', () => {
    render(
      <ChakraProvider>
        <BrowserRouter>
          <OnboardingWizardPreview />
        </BrowserRouter>
      </ChakraProvider>
    );
    
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });

  it('renders preview after loading', async () => {
    render(
      <ChakraProvider>
        <BrowserRouter>
          <OnboardingWizardPreview />
        </BrowserRouter>
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
    });
    
    // Check if preview tabs are rendered
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('allows switching user types', async () => {
    render(
      <ChakraProvider>
        <BrowserRouter>
          <OnboardingWizardPreview />
        </BrowserRouter>
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
    });
    
    // Find and change user type select
    const userTypeSelect = screen.getByLabelText('Select user type');
    fireEvent.change(userTypeSelect, { target: { value: 'ai_agent' } });
    
    // Check if validation is triggered
    expect(OnboardingAdminService.validateConfiguration).toHaveBeenCalled();
  });

  it('runs validation when validation button is clicked', async () => {
    render(
      <ChakraProvider>
        <BrowserRouter>
          <OnboardingWizardPreview />
        </BrowserRouter>
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
    });
    
    // Switch to validation tab
    fireEvent.click(screen.getByText('Validation'));
    
    // Click run validation button
    fireEvent.click(screen.getByText('Run Validation'));
    
    // Check if validation service method was called
    await waitFor(() => {
      expect(OnboardingAdminService.validateConfiguration).toHaveBeenCalled();
    });
  });

  it('handles validation errors gracefully', async () => {
    // Setup error mock
    const errorValidationResult = {
      valid: false,
      status: 'error',
      message: 'Configuration has errors',
      details: ['Missing required field in step 2']
    };
    
    (OnboardingAdminService.validateConfiguration as jest.Mock).mockResolvedValue(errorValidationResult);
    
    render(
      <ChakraProvider>
        <BrowserRouter>
          <OnboardingWizardPreview />
        </BrowserRouter>
      </ChakraProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
    });
    
    // Switch to validation tab
    fireEvent.click(screen.getByText('Validation'));
    
    // Click run validation button
    fireEvent.click(screen.getByText('Run Validation'));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Configuration has errors')).toBeInTheDocument();
    });
    
    // Check if error details are displayed
    expect(screen.getByText('Missing required field in step 2')).toBeInTheDocument();
  });
});
