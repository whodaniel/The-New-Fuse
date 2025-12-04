import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Button } from '../Button';
describe('Button Snapshots', function () {
    it('renders default button correctly', function () {
        assertSnapshot(_jsx(Button, { children: "Click me" }));
    });
    it('renders different variants correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Button, { variant: "default", children: "Default" }), _jsx(Button, { variant: "destructive", children: "Destructive" }), _jsx(Button, { variant: "outline", children: "Outline" }), _jsx(Button, { variant: "secondary", children: "Secondary" }), _jsx(Button, { variant: "ghost", children: "Ghost" }), _jsx(Button, { variant: "link", children: "Link" })] }));
    });
    it('renders different sizes correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Button, { size: "default", children: "Default Size" }), _jsx(Button, { size: "sm", children: "Small" }), _jsx(Button, { size: "lg", children: "Large" }), _jsx(Button, { size: "icon", children: _jsx("svg", { "data-testid": "test-icon", viewBox: "0 0 24 24" }) })] }));
    });
    it('renders loading state correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Button, { isLoading: true, children: "Loading Button" }), _jsx(Button, { isLoading: true, variant: "destructive", children: "Loading Destructive" })] }));
    });
    it('renders disabled state correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Button, { disabled: true, children: "Disabled Button" }), _jsx(Button, { disabled: true, variant: "destructive", children: "Disabled Destructive" })] }));
    });
    it('renders with start and end icons', function () {
        var TestIcon = function () { return (_jsx("svg", { "data-testid": "test-icon", viewBox: "0 0 24 24" })); };
        assertSnapshot(_jsxs(_Fragment, { children: [_jsxs(Button, { children: [_jsx(TestIcon, {}), "With Start Icon"] }), _jsxs(Button, { children: ["With End Icon", _jsx(TestIcon, {})] })] }));
    });
});
