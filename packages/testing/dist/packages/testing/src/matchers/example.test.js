"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const index_1 = require("./index");
const zod_1 = require("zod");
// Set up custom matchers
(0, index_1.setupTestMatchers)();
describe('Custom Matcher Examples', () => {
    it('demonstrates workflow validation', () => {
        const workflow = {
            id: '123',
            name: 'Test Workflow',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            steps: [
                {
                    id: 'step1',
                    name: 'First Step',
                    status: 'pending'
                }
            ]
        };
        expect(workflow).toBeValidWorkflow();
    });
    it('demonstrates permission checking', () => {
        const user = {
            id: 'user1',
            permissions: ['read:posts'],
            roles: [{ name: 'editor', permissions: ['edit:posts'] }]
        };
        expect(user).toHavePermission('read:posts');
        expect(user).toHavePermission('edit:posts');
    });
    it('demonstrates API contract validation', () => {
        const response = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { id: '123', name: 'Test User' }
        };
        const contract = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            schema: zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() })
        };
        expect(response).toMatchAPIContract(contract);
    });
    it('demonstrates component validation', () => {
        const TestComponent = (props) => (0, jsx_runtime_1.jsx)("div", { ...props });
        TestComponent.displayName = 'TestComponent';
        const component = (0, jsx_runtime_1.jsx)(TestComponent, { title: "Test" });
        expect(component).toBeValidComponent({
            displayName: 'TestComponent',
            requiredProps: ['title'],
            childrenAllowed: false
        });
    });
    it('demonstrates timing validation', async () => {
        const fastOperation = Promise.resolve('done');
        await expect(fastOperation).toCompleteWithinTime(100);
        const slowOperation = new Promise(resolve => setTimeout(resolve, 1000));
        await expect(slowOperation).not.toCompleteWithinTime(100);
    });
    // Example for toBeValidComponent (assuming a simple component structure)
    describe('toBeValidComponent', () => {
        const TestComponent = (props) => (0, jsx_runtime_1.jsx)("div", { ...props });
        const ValidComponent = (0, jsx_runtime_1.jsx)(TestComponent, { id: "test" });
        const InvalidComponent = null; // Example of an invalid component (null)
        it('should pass for a valid React element', () => {
            expect(ValidComponent).toBeValidComponent({
                displayName: 'TestComponent'
            });
        });
        // This test will likely fail if the matcher doesn't handle null gracefully
        // Depending on the matcher's logic, this might be expected or need adjustment
        it('should fail for null or undefined (or throw error if not handled)', () => {
            // expect(InvalidComponent).not.toBeValidComponent();
            // OR, if it throws:
            expect(() => expect(InvalidComponent).toBeValidComponent({})).toThrow();
        });
        it('should validate component against a Zod schema if provided', () => {
            const schema = zod_1.z.object({
                id: zod_1.z.string(),
                optionalProp: zod_1.z.number().optional(),
            });
            expect(ValidComponent).toBeValidComponent(schema);
        });
        it('should fail validation if component props do not match schema', () => {
            const schema = zod_1.z.object({
                id: zod_1.z.string(),
                requiredProp: zod_1.z.number(), // This prop is missing from ValidComponent
            });
            expect(() => expect(ValidComponent).toBeValidComponent(schema)).toThrow(); // Or .not.toBeValidComponent()
        });
    });
    // Example for toBeValidWorkflow (conceptual)
    describe('toBeValidWorkflow', () => {
        it('should pass for a workflow conforming to the schema', () => {
            const validWorkflow = {
                id: 'wf-123',
                name: 'Test Workflow',
                nodes: [{ id: 'node-1', type: 'start', position: { x: 0, y: 0 } }],
                edges: [],
                status: 'draft',
            };
            expect(validWorkflow).toBeValidWorkflow();
        });
        it('should fail for a workflow not conforming to the schema', () => {
            const invalidWorkflow = { id: 'wf-456', name: null }; // Missing required fields / wrong types
            expect(invalidWorkflow).not.toBeValidWorkflow();
        });
    });
    // Example for toHavePermission (conceptual)
    describe('toHavePermission', () => {
        const userPermissions = ['read:document', 'write:document'];
        it('should pass if user has the required permission', () => {
            expect(userPermissions).toHavePermission('read:document');
        });
        it('should fail if user does not have the required permission', () => {
            expect(userPermissions).not.toHavePermission('delete:document');
        });
    });
    // Example for toMatchAPIContract (conceptual)
    describe('toMatchAPIContract', () => {
        const mockAPIContract = {
            status: 200,
            schema: zod_1.z.object({ success: zod_1.z.boolean(), data: zod_1.z.any().optional() }),
        };
        it('should pass if response matches the contract', () => {
            const apiResponse = {
                status: 200,
                headers: { 'content-type': 'application/json' },
                data: { success: true, data: { message: 'ok' } }
            };
            expect(apiResponse).toMatchAPIContract(mockAPIContract);
        });
        it('should fail if response does not match the contract', () => {
            const apiResponse = {
                status: 404,
                headers: {},
                data: { success: true }
            };
            expect(apiResponse).not.toMatchAPIContract(mockAPIContract);
        });
    });
    // Example for toCompleteWithinTime (conceptual)
    describe('toCompleteWithinTime', () => {
        it('should pass if the function completes within the time limit', async () => {
            const fastFunction = () => new Promise(resolve => setTimeout(resolve, 50));
            await expect(fastFunction()).toCompleteWithinTime(100); // Expect to complete within 100ms
        });
        it('should fail if the function does not complete within the time limit', async () => {
            const slowFunction = () => new Promise(resolve => setTimeout(resolve, 200));
            // Using .rejects or try/catch for async matchers that are expected to fail
            await expect(expect(slowFunction()).toCompleteWithinTime(100)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=example.test.js.map