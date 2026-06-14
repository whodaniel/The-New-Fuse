"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const __1 = require("..");
describe('useA2AMessages', () => {
    it('should return messages from context', () => {
        const wrapper = ({ children }) => ((0, jsx_runtime_1.jsx)(__1.A2AProvider, { config: { url: 'ws://localhost:8080', agentId: 'test-agent' }, children: children }));
        const { result } = (0, react_1.renderHook)(() => (0, __1.useA2AMessages)(), { wrapper });
        expect(result.current.messages).toEqual([]);
    });
});
//# sourceMappingURL=useA2AMessages.test.js.map