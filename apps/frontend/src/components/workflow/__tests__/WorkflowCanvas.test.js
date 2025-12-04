var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { WorkflowCanvas } from '../WorkflowCanvas';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { ReactFlowProvider } from 'reactflow';
// Mock the toast notifications
jest.mock('react-toastify', function () { return ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warning: jest.fn()
    }
}); });
// Mock the services
jest.mock('@/services/WorkflowExecutionService', function () { return ({
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
}); });
// Mock the hooks
jest.mock('@/hooks', function () { return ({
    useWorkflow: function () { return ({
        workflow: { id: 'test-workflow', name: 'Test Workflow' },
        saveWorkflow: jest.fn(),
        loadWorkflow: jest.fn()
    }); },
    useA2ACommunication: function () { return ({
        agents: [],
        messages: [],
        loading: false,
        error: null,
        loadAgents: jest.fn(),
        sendMessage: jest.fn(),
        broadcastMessage: jest.fn(),
        sendRequestAndWaitForResponse: jest.fn()
    }); }
}); });
// Wrap component with required providers
var renderWorkflowCanvas = function (props) {
    if (props === void 0) { props = {}; }
    return render(_jsx(ReactFlowProvider, { children: _jsx(WorkflowProvider, { children: _jsx(WorkflowCanvas, __assign({}, props)) }) }));
};
describe('WorkflowCanvas', function () {
    beforeEach(function () {
        jest.clearAllMocks();
    });
    it('renders without crashing', function () {
        renderWorkflowCanvas();
        expect(screen.getByText('Templates')).toBeInTheDocument();
    });
    it('renders toolbar buttons', function () {
        renderWorkflowCanvas();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Load')).toBeInTheDocument();
        expect(screen.getByText('Validate')).toBeInTheDocument();
        expect(screen.getByText('Optimize')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('Import')).toBeInTheDocument();
    });
    it('disables buttons in read-only mode', function () {
        renderWorkflowCanvas({ isReadOnly: true });
        expect(screen.getByText('Save')).toBeDisabled();
        expect(screen.getByText('Load')).toBeDisabled();
        expect(screen.getByText('Import')).toBeDisabled();
    });
    // Add more tests as needed
});
