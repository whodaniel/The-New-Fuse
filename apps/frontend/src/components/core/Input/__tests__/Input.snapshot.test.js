import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Input } from '../Input';
describe('Input Snapshots', function () {
    it('renders default input correctly', function () {
        assertSnapshot(_jsx(Input, { placeholder: "Enter text..." }));
    });
    it('renders with label correctly', function () {
        assertSnapshot(_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "test-input", children: "Label Text" }), _jsx(Input, { id: "test-input", placeholder: "Labeled input" })] }));
    });
    it('renders with error state correctly', function () {
        assertSnapshot(_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { error: "This field is required", placeholder: "Error input" }), _jsx("span", { className: "text-sm text-red-500", children: "This field is required" })] }));
    });
    it('renders disabled state correctly', function () {
        assertSnapshot(_jsx(Input, { disabled: true, placeholder: "Disabled input" }));
    });
    it('renders with different types correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Input, { type: "text", placeholder: "Text input" }), _jsx(Input, { type: "password", placeholder: "Password input" }), _jsx(Input, { type: "email", placeholder: "Email input" }), _jsx(Input, { type: "number", placeholder: "Number input" }), _jsx(Input, { type: "search", placeholder: "Search input" })] }));
    });
    it('renders with prefix and suffix correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx(Input, { className: "pl-7", placeholder: "Amount", type: "number" })] }), _jsxs("div", { className: "relative", children: [_jsx(Input, { className: "pr-12", placeholder: "Weight", type: "number" }), _jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500", children: "kg" })] })] }));
    });
});
