import { render } from '@testing-library/react';
const MockThemeProvider = ({ children }): any => <>{children}</>;
const MockAuthProvider = ({ children }): any => <>{children}</>;
const MockWorkflowProvider = ({ children }): any => <>{children}</>;
const AllTheProviders = ({ children }): any => {
    return (<MockThemeProvider>
            <MockAuthProvider>
                <MockWorkflowProvider>
                    {children}
                </MockWorkflowProvider>
            </MockAuthProvider>
        </MockThemeProvider>);
};
export const createMockNode = (overrides = {}): any => (Object.assign({ id: 'test-node-1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'Test Node' }, selected: false, dragging: false }, overrides));
export const createMockEdge = (overrides = {}): any => (Object.assign({ id: 'test-edge-1', source: 'test-node-1', target: 'test-node-2', label: 'Test Edge', selected: false, animated: false }, overrides));
export const createMockUser = (overrides = {}): any => (Object.assign({ id: 'test-user-1', name: 'Test User', email: 'test@example.com', roles: ['user'], preferences: {} }, overrides));
export const createMockWorkflow = (overrides = {}): any => (Object.assign({ id: 'test-workflow-1', name: 'Test Workflow', nodes: [createMockNode()], edges: [createMockEdge()], version: '1.0.0', metadata: {} }, overrides));
export const mockAuthContextValue = {
    user: createMockUser(),
    isAuthenticated: true,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    loading: false,
    error: null
};
export const mockWorkflowContextValue = {
    workflows: [createMockWorkflow()],
    currentWorkflow: createMockWorkflow(),
    setCurrentWorkflow: jest.fn(),
    addWorkflow: jest.fn().mockResolvedValue(undefined),
    updateWorkflow: jest.fn().mockResolvedValue(undefined),
    deleteWorkflow: jest.fn().mockResolvedValue(undefined),
    loading: false,
    error: null
};
const customRender = (ui, options): any => render(ui, Object.assign({ wrapper: AllTheProviders }, options));
export * from '@testing-library/react';
export { customRender as render };
//# sourceMappingURL=testUtils.js.map