export declare const createMockNode: (overrides?: {}) => any;
export declare const createMockEdge: (overrides?: {}) => any;
export declare const createMockUser: (overrides?: {}) => any;
export declare const createMockWorkflow: (overrides?: {}) => any;
export declare const mockAuthContextValue: {
    user: any;
    isAuthenticated: boolean;
    login: jest.Mock<any, any, any>;
    logout: jest.Mock<any, any, any>;
    loading: boolean;
    error: null;
};
export declare const mockWorkflowContextValue: {
    workflows: any[];
    currentWorkflow: any;
    setCurrentWorkflow: jest.Mock<any, any, any>;
    addWorkflow: jest.Mock<any, any, any>;
    updateWorkflow: jest.Mock<any, any, any>;
    deleteWorkflow: jest.Mock<any, any, any>;
    loading: boolean;
    error: null;
};
declare const customRender: (ui: any, options: any) => any;
export * from '@testing-library/react';
export { customRender as render };
