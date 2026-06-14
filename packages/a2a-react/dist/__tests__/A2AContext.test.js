"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const __1 = require("..");
describe('useA2AContext', () => {
    it('should throw an error when used outside of a provider', () => {
        // Suppress console.error for this test
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => (0, react_1.renderHook)(() => (0, __1.useA2AContext)())).toThrow('useA2AContext must be used within an A2AProvider');
        consoleErrorSpy.mockRestore();
    });
    it('should provide context when used within a provider', () => {
        const wrapper = ({ children }) => ((0, jsx_runtime_1.jsx)(__1.A2AProvider, { config: { url: 'ws://test', agentId: 'test-agent' }, children: children }));
        const { result } = (0, react_1.renderHook)(() => (0, __1.useA2AContext)(), { wrapper });
        expect(result.current).toBeDefined();
        expect(result.current.connectionState.connected).toBe(false);
        expect(result.current.agents).toEqual([]);
    });
});
//# sourceMappingURL=A2AContext.test.js.map