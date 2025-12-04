import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { render } from '@testing-library/react';
var MockThemeProvider = function (_a) {
    var children = _a.children;
    return _jsx(_Fragment, { children: children });
};
var MockAuthProvider = function (_a) {
    var children = _a.children;
    return _jsx(_Fragment, { children: children });
};
var MockWorkflowProvider = function (_a) {
    var children = _a.children;
    return _jsx(_Fragment, { children: children });
};
var AllTheProviders = function (_a) {
    var children = _a.children;
    return (_jsx(MockThemeProvider, { children: _jsx(MockAuthProvider, { children: _jsx(MockWorkflowProvider, { children: children }) }) }));
};
export var createMockNode = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (Object.assign({ id: 'test-node-1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'Test Node' }, selected: false, dragging: false }, overrides));
};
export var createMockEdge = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (Object.assign({ id: 'test-edge-1', source: 'test-node-1', target: 'test-node-2', label: 'Test Edge', selected: false, animated: false }, overrides));
};
export var createMockUser = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (Object.assign({ id: 'test-user-1', name: 'Test User', email: 'test@example.com', roles: ['user'], preferences: {} }, overrides));
};
export var createMockWorkflow = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (Object.assign({ id: 'test-workflow-1', name: 'Test Workflow', nodes: [createMockNode()], edges: [createMockEdge()], version: '1.0.0', metadata: {} }, overrides));
};
export var mockAuthContextValue = {
    user: createMockUser(),
    isAuthenticated: true,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    loading: false,
    error: null
};
export var mockWorkflowContextValue = {
    workflows: [createMockWorkflow()],
    currentWorkflow: createMockWorkflow(),
    setCurrentWorkflow: jest.fn(),
    addWorkflow: jest.fn().mockResolvedValue(undefined),
    updateWorkflow: jest.fn().mockResolvedValue(undefined),
    deleteWorkflow: jest.fn().mockResolvedValue(undefined),
    loading: false,
    error: null
};
var customRender = function (ui, options) { return render(ui, Object.assign({ wrapper: AllTheProviders }, options)); };
export * from '@testing-library/react';
export { customRender as render };
