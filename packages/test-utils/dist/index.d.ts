/**
 * @the-new-fuse/test-utils
 * Testing utilities for The New Fuse
 */
export declare const createMockUser: (overrides?: {}) => {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockAgent: (overrides?: {}) => {
    id: string;
    name: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockConversation: (overrides?: {}) => {
    id: string;
    title: string;
    messages: never[];
    createdAt: Date;
    updatedAt: Date;
};
export declare const waitFor: (ms: number) => Promise<void>;
export declare const mockApiResponse: (data: any, status?: number) => {
    ok: boolean;
    status: number;
    json: () => Promise<any>;
    text: () => Promise<string>;
};
export declare const clearDatabase: () => Promise<void>;
export declare const seedDatabase: (_data?: Record<string, any>) => Promise<void>;
export declare const renderWithProviders: (component: any, _options?: Record<string, any>) => any;
export declare const createTestServer: () => {
    listen: () => void;
    close: () => void;
};
//# sourceMappingURL=index.d.ts.map