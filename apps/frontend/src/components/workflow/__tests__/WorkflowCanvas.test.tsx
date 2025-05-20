import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowCanvas } from '../WorkflowCanvas.js';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { ReactFlowProvider } from 'reactflow';

// Mock the toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

// Mock the services
jest.mock('@/services/WorkflowExecutionService', () => ({
  workflowExecutionService: {
    executeWorkflow: jest.fn(),
    abortExecution: jest.fn(),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    setA2AService: jest.fn(),
    getDebugOptions: jest.fn().mockReturnValue({
      enabled: false,
      stepByStep: false,
      breakpoints: [],
      logLevel: 'info'
    }),
    setDebugOptions: jest.fn()
  },
  ExecutionUpdate: jest.fn()
}));

// Mock the hooks
jest.mock('@/hooks', () => ({
  useWorkflow: () => ({
    workflow: { id: 'test-workflow', name: 'Test Workflow' },
    saveWorkflow: jest.fn(),
    loadWorkflow: jest.fn()
  }),
  useA2ACommunication: () => ({
    agents: [],
    messages: [],
    loading: false,
    error: null,
    loadAgents: jest.fn(),
    sendMessage: jest.fn(),
    broadcastMessage: jest.fn(),
    sendRequestAndWaitForResponse: jest.fn()
  })
}));

// Wrap component with required providers
const renderWorkflowCanvas = (props = {}) => {
  return render(
    <ReactFlowProvider>
      <WorkflowProvider>
        <WorkflowCanvas {...props} />
      </WorkflowProvider>
    </ReactFlowProvider>
  );
};

describe('WorkflowCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders without crashing', () => {
    renderWorkflowCanvas();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });
  
  it('renders toolbar buttons', () => {
    renderWorkflowCanvas();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Optimize')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });
  
  it('disables buttons in read-only mode', () => {
    renderWorkflowCanvas({ isReadOnly: true });
    expect(screen.getByText('Save')).toBeDisabled();
    expect(screen.getByText('Load')).toBeDisabled();
    expect(screen.getByText('Import')).toBeDisabled();
  });
  
  // Add more tests as needed
});
