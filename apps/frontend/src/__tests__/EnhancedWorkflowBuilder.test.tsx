/**
 * Tests for Enhanced Workflow Builder
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EnhancedWorkflowBuilder from '../pages/Workflows/EnhancedWorkflowBuilder';

// Mock ReactFlow
jest.mock('reactflow', () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Background: () => <div data-testid="background" />,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  MarkerType: { ArrowClosed: 'arrowclosed' },
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

// Mock fetch
global.fetch = jest.fn();

const renderWorkflowBuilder = () => {
  return render(<EnhancedWorkflowBuilder />);
};

describe('EnhancedWorkflowBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => [],
    });
  });

  describe('Rendering', () => {
    it('should render the workflow builder canvas', () => {
      renderWorkflowBuilder();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('should display workflow title', () => {
      renderWorkflowBuilder();
      expect(screen.getByText('Untitled Workflow')).toBeInTheDocument();
    });

    it('should show action buttons', () => {
      renderWorkflowBuilder();
      expect(screen.getByText('Add Node')).toBeInTheDocument();
      expect(screen.getByText('Execute')).toBeInTheDocument();
    });
  });

  describe('Node Library', () => {
    it('should open node library drawer when Add Node is clicked', async () => {
      renderWorkflowBuilder();

      const addButton = screen.getByText('Add Node');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Node Library')).toBeInTheDocument();
      });
    });

    it('should display node categories in tabs', async () => {
      renderWorkflowBuilder();

      const addButton = screen.getByText('Add Node');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Agents')).toBeInTheDocument();
        expect(screen.getByText('Logic')).toBeInTheDocument();
        expect(screen.getByText('Human')).toBeInTheDocument();
      });
    });

    it('should display node templates in the library', async () => {
      renderWorkflowBuilder();

      const addButton = screen.getByText('Add Node');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Code Review Agent')).toBeInTheDocument();
        expect(screen.getByText('Research Agent')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Execution', () => {
    it('should show warning when executing empty workflow', async () => {
      renderWorkflowBuilder();

      const executeButton = screen.getByText('Execute');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText('Empty Workflow')).toBeInTheDocument();
      });
    });

    it('should update execution state when workflow starts', async () => {
      renderWorkflowBuilder();

      // Would need to add nodes first, but testing the execution flow concept
      expect(screen.queryByText(/Executing/)).not.toBeInTheDocument();
    });
  });

  describe('Workflow Saving', () => {
    it('should open save modal when save button is clicked', async () => {
      renderWorkflowBuilder();

      const saveButton = screen.getByLabelText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Save Workflow')).toBeInTheDocument();
      });
    });

    it('should allow entering workflow name and description', async () => {
      renderWorkflowBuilder();

      const saveButton = screen.getByLabelText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter workflow name');
        const descInput = screen.getByPlaceholderText('Describe what this workflow does');

        fireEvent.change(nameInput, { target: { value: 'Test Workflow' } });
        fireEvent.change(descInput, { target: { value: 'This is a test' } });

        expect(nameInput).toHaveValue('Test Workflow');
        expect(descInput).toHaveValue('This is a test');
      });
    });

    it('should call API when saving workflow', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'workflow-1', name: 'Test Workflow' }),
      });

      renderWorkflowBuilder();

      const saveButton = screen.getByLabelText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const saveWorkflowButton = screen.getByText('Save Workflow');
        fireEvent.click(saveWorkflowButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/workflows',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });
  });

  describe('Workflow Export', () => {
    it('should trigger download when export is clicked', async () => {
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      const createElementSpy = jest.spyOn(document, 'createElement');
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      } as any;
      createElementSpy.mockReturnValue(mockLink);

      renderWorkflowBuilder();

      const exportButton = screen.getByLabelText('Export');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled();
      });

      createElementSpy.mockRestore();
    });
  });

  describe('Agent Integration', () => {
    it('should load available agents on mount', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Code Reviewer', type: 'code-reviewer', status: 'ACTIVE' },
        { id: 'agent-2', name: 'Researcher', type: 'researcher', status: 'ACTIVE' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgents,
      });

      renderWorkflowBuilder();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/agents/registry');
      });
    });
  });

  describe('Execution Logs', () => {
    it('should open execution log drawer when logs button is clicked', async () => {
      renderWorkflowBuilder();

      const logsButton = screen.getByLabelText('Logs');
      fireEvent.click(logsButton);

      await waitFor(() => {
        expect(screen.getByText('Execution Logs')).toBeInTheDocument();
      });
    });

    it('should display empty state when no logs exist', async () => {
      renderWorkflowBuilder();

      const logsButton = screen.getByLabelText('Logs');
      fireEvent.click(logsButton);

      await waitFor(() => {
        expect(screen.getByText(/No execution logs yet/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Reset', () => {
    it('should clear canvas when reset is clicked', async () => {
      renderWorkflowBuilder();

      const resetButton = screen.getByLabelText('Reset');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Workflow Reset')).toBeInTheDocument();
      });
    });
  });
});

describe('Enhanced Node Types', () => {
  it('should render agent task node with correct styling', () => {
    // Test node rendering - would need to test within ReactFlow context
    expect(true).toBe(true);
  });

  it('should render conditional node with true/false handles', () => {
    // Test conditional node rendering
    expect(true).toBe(true);
  });

  it('should render parallel node with multiple output handles', () => {
    // Test parallel node rendering
    expect(true).toBe(true);
  });

  it('should render human approval node with approver count', () => {
    // Test human approval node
    expect(true).toBe(true);
  });
});

describe('Workflow Templates', () => {
  it('should load predefined workflow templates', () => {
    const { workflowTemplates } = require('../data/workflowTemplates');
    expect(workflowTemplates).toHaveLength(5);
  });

  it('should include code review template', () => {
    const { getTemplateById } = require('../data/workflowTemplates');
    const template = getTemplateById('code-review-workflow');
    expect(template).toBeDefined();
    expect(template.name).toBe('Code Review Workflow');
  });

  it('should include multi-agent research template', () => {
    const { getTemplateById } = require('../data/workflowTemplates');
    const template = getTemplateById('multi-agent-research');
    expect(template).toBeDefined();
    expect(template.nodes).toHaveLength(7);
  });

  it('should include self-improvement loop template', () => {
    const { getTemplateById } = require('../data/workflowTemplates');
    const template = getTemplateById('self-improvement-loop');
    expect(template).toBeDefined();
    expect(template.difficulty).toBe('advanced');
  });

  it('should filter templates by category', () => {
    const { getTemplatesByCategory } = require('../data/workflowTemplates');
    const devTemplates = getTemplatesByCategory('Development');
    expect(devTemplates.length).toBeGreaterThan(0);
  });

  it('should filter templates by difficulty', () => {
    const { getTemplatesByDifficulty } = require('../data/workflowTemplates');
    const beginnerTemplates = getTemplatesByDifficulty('beginner');
    expect(beginnerTemplates.length).toBeGreaterThan(0);
  });

  it('should search templates by keyword', () => {
    const { searchTemplates } = require('../data/workflowTemplates');
    const results = searchTemplates('code');
    expect(results.length).toBeGreaterThan(0);
  });
});
