"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const toBeValidComponent_1 = require("../toBeValidComponent");
describe('toBeValidComponent', () => {
    const TestComponent = (props) => (0, jsx_runtime_1.jsx)("div", { ...props });
    TestComponent.displayName = 'TestComponent';
    // Define WrongComponent to accept props
    const WrongComponent = (props) => (0, jsx_runtime_1.jsx)("div", { ...props });
    WrongComponent.displayName = 'WrongComponent';
    const validator = {
        displayName: 'TestComponent',
        requiredProps: ['title'],
        props: {
            title: (value) => typeof value === 'string',
            count: (value) => typeof value === 'number'
        },
        childrenAllowed: false
    };
    it('should pass for valid component', async () => {
        const component = (0, jsx_runtime_1.jsx)(TestComponent, { title: "Test", count: 5 });
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, component, validator);
        expect(result.pass).toBe(true);
    });
    it('should fail for wrong display name', async () => {
        // Use the corrected WrongComponent definition
        const component = (0, jsx_runtime_1.jsx)(WrongComponent, { title: "Test" });
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, component, validator);
        expect(result.pass).toBe(false);
    });
    it('should fail for missing required prop', async () => {
        const component = (0, jsx_runtime_1.jsx)(TestComponent, { count: 5 });
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, component, validator);
        expect(result.pass).toBe(false);
    });
    it('should fail for invalid prop type', async () => {
        const component = (0, jsx_runtime_1.jsx)(TestComponent, { title: "Test", count: "5" });
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, component, validator);
        expect(result.pass).toBe(false);
    });
    it('should fail when children not allowed', async () => {
        const component = ((0, jsx_runtime_1.jsx)(TestComponent, { title: "Test", count: 5, children: (0, jsx_runtime_1.jsx)("span", { children: "Child content" }) }));
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, component, validator);
        expect(result.pass).toBe(false);
    });
    it('should pass when children allowed', async () => {
        const validatorWithChildren = { ...validator, childrenAllowed: true };
        const component = ((0, jsx_runtime_1.jsx)(TestComponent, { title: "Test", count: 5, children: (0, jsx_runtime_1.jsx)("span", { children: "Child content" }) }));
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, component, validatorWithChildren);
        expect(result.pass).toBe(true);
    });
    it('should handle non-React elements', async () => {
        // Pass null instead of {} for non-element test
        const result = await toBeValidComponent_1.toBeValidComponent.call({}, null, validator);
        expect(result.pass).toBe(false);
    });
});
//# sourceMappingURL=toBeValidComponent.test.js.map