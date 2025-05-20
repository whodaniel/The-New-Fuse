import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentWorkflowManager } from '../AgentWorkflowManager.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

// Mock the WebSocket hook
jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn()
}));

const mockWorkflows = [
  {
    id: '1',
    name: 'Analysis Workflow',
    status: 'running',
    progress: 75,
    agentCount: 3,
    type: 'analysis',
    metrics: {
      tasksCompleted: 150,
      tasksRemaining: 50,
      errorRate: 2
    }
  },
  {
    id: '2',
    name: 'Trading Workflow',
    status: 'paused',
    progress: 45,
    agentCount: 2,
    type: 'trading',
    metrics: {
      tasksCompleted: 80,
      tasksRemaining: 120,
      errorRate: 5
    }
  }
];

describe('AgentWorkflowManager', () => {
  beforeEach(() => {
    const mockSubscribe = jest.fn((channel, callback) => {
      if (channel === 'workflow_updates') {
        callback(mockWorkflows);
      }
      return () => {};
    });

    const mockSend = jest.fn();

    (useWebSocket as jest.Mock).mockReturnValue({
      subscribe: mockSubscribe,
      send: mockSend
    });
  });

  it('renders workflow list', async () => {
    render(<AgentWorkflowManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
      expect(screen.getByText('Trading Workflow')).toBeInTheDocument();
    });
  });

  it('filters workflows by type', async () => {
    render(<AgentWorkflowManager />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'trading' } });

    await waitFor(() => {
      expect(screen.queryByText('Analysis Workflow')).not.toBeInTheDocument();
      expect(screen.getByText('Trading Workflow')).toBeInTheDocument();
    });
  });

  it('handles workflow actions', async () => {
    const { send } = useWebSocket();
    render(<AgentWorkflowManager />);

    const pauseButton = await screen.findByText('Pause');
    fireEvent.click(pauseButton);

    expect(send).toHaveBeenCalledWith('workflow_action', {
      id: '1',
      action: 'pause'
    });
  });
});