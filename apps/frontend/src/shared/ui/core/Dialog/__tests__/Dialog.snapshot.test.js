import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Dialog } from '../Dialog';
import { Button } from '../../Button';
describe('Dialog Snapshots', function () {
    it('renders basic dialog correctly', function () {
        assertSnapshot(_jsx(Dialog, { open: true, children: _jsxs(Dialog.Content, { children: [_jsxs(Dialog.Header, { children: [_jsx(Dialog.Title, { children: "Basic Dialog" }), _jsx(Dialog.Description, { children: "This is a basic dialog content" })] }), _jsx("p", { children: "Dialog content goes here" })] }) }));
    });
    it('renders dialog with actions', function () {
        assertSnapshot(_jsx(Dialog, { open: true, children: _jsxs(Dialog.Content, { children: [_jsxs(Dialog.Header, { children: [_jsx(Dialog.Title, { children: "Confirmation Dialog" }), _jsx(Dialog.Description, { children: "Are you sure you want to perform this action?" })] }), _jsxs(Dialog.Footer, { children: [_jsx(Button, { variant: "outline", onClick: function () { }, children: "Cancel" }), _jsx(Button, { variant: "default", onClick: function () { }, children: "Confirm" })] })] }) }));
    });
    it('renders dialog with custom width', function () {
        assertSnapshot(_jsx(Dialog, { open: true, children: _jsxs(Dialog.Content, { className: "max-w-2xl", children: [_jsx(Dialog.Header, { children: _jsx(Dialog.Title, { children: "Wide Dialog" }) }), _jsx("p", { children: "This is a wider dialog with custom max-width" })] }) }));
    });
    it('renders dialog with form content', function () {
        assertSnapshot(_jsx(Dialog, { open: true, children: _jsxs(Dialog.Content, { children: [_jsx(Dialog.Header, { children: _jsx(Dialog.Title, { children: "Edit Profile" }) }), _jsxs("form", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "text-sm font-medium", children: "Name" }), _jsx("input", { id: "name", className: "mt-1 block w-full rounded-md border p-2", placeholder: "Enter your name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "text-sm font-medium", children: "Email" }), _jsx("input", { id: "email", type: "email", className: "mt-1 block w-full rounded-md border p-2", placeholder: "Enter your email" })] })] }), _jsxs(Dialog.Footer, { children: [_jsx(Button, { variant: "outline", children: "Cancel" }), _jsx(Button, { type: "submit", children: "Save Changes" })] })] }) }));
    });
    it('renders dialog with custom close trigger', function () {
        assertSnapshot(_jsx(Dialog, { open: true, children: _jsxs(Dialog.Content, { children: [_jsxs(Dialog.Header, { children: [_jsx(Dialog.Title, { children: "Custom Close" }), _jsx(Dialog.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100", children: "\u2715" })] }), _jsx("p", { children: "Dialog with custom close button" })] }) }));
    });
});
