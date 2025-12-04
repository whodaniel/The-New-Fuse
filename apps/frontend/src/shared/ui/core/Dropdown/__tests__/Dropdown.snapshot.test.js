import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Dropdown } from '../Dropdown';
describe('Dropdown Snapshots', function () {
    it('renders basic dropdown correctly', function () {
        assertSnapshot(_jsxs(Dropdown, { children: [_jsx(Dropdown.Trigger, { children: "Open Menu" }), _jsxs(Dropdown.Content, { children: [_jsx(Dropdown.Item, { children: "Item 1" }), _jsx(Dropdown.Item, { children: "Item 2" }), _jsx(Dropdown.Item, { children: "Item 3" })] })] }));
    });
    it('renders dropdown with sections and separators', function () {
        assertSnapshot(_jsxs(Dropdown, { children: [_jsx(Dropdown.Trigger, { children: "Menu" }), _jsxs(Dropdown.Content, { children: [_jsxs(Dropdown.Group, { children: [_jsx(Dropdown.Label, { children: "User" }), _jsx(Dropdown.Item, { children: "Profile" }), _jsx(Dropdown.Item, { children: "Settings" })] }), _jsx(Dropdown.Separator, {}), _jsxs(Dropdown.Group, { children: [_jsx(Dropdown.Label, { children: "Account" }), _jsx(Dropdown.Item, { children: "Billing" }), _jsx(Dropdown.Item, { children: "Subscription" })] })] })] }));
    });
    it('renders dropdown with disabled items', function () {
        assertSnapshot(_jsxs(Dropdown, { children: [_jsx(Dropdown.Trigger, { children: "Actions" }), _jsxs(Dropdown.Content, { children: [_jsx(Dropdown.Item, { children: "Edit" }), _jsx(Dropdown.Item, { disabled: true, children: "Delete" }), _jsx(Dropdown.Separator, {}), _jsx(Dropdown.Item, { children: "Share" })] })] }));
    });
    it('renders dropdown with icons', function () {
        assertSnapshot(_jsxs(Dropdown, { children: [_jsx(Dropdown.Trigger, { children: _jsxs("span", { className: "flex items-center", children: [_jsx("svg", { className: "w-4 h-4 mr-2", viewBox: "0 0 24 24" }), "Options"] }) }), _jsxs(Dropdown.Content, { children: [_jsxs(Dropdown.Item, { children: [_jsx("svg", { className: "w-4 h-4 mr-2", viewBox: "0 0 24 24" }), "Edit"] }), _jsxs(Dropdown.Item, { children: [_jsx("svg", { className: "w-4 h-4 mr-2", viewBox: "0 0 24 24" }), "Delete"] })] })] }));
    });
    it('renders dropdown with checkbox items', function () {
        assertSnapshot(_jsxs(Dropdown, { children: [_jsx(Dropdown.Trigger, { children: "Filters" }), _jsxs(Dropdown.Content, { children: [_jsx(Dropdown.CheckboxItem, { checked: true, children: "Show Archived" }), _jsx(Dropdown.CheckboxItem, { children: "Show Deleted" }), _jsx(Dropdown.Separator, {}), _jsx(Dropdown.CheckboxItem, { checked: true, disabled: true, children: "Show System Files" })] })] }));
    });
});
