import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Modal } from '../Modal';
import { Button } from '../../Button';
describe('Modal Snapshots', function () {
    it('renders basic modal correctly', function () {
        assertSnapshot(_jsx(Modal, { isOpen: true, onClose: function () { }, children: _jsxs("div", { className: "p-4", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Basic Modal" }), _jsx("p", { children: "This is a basic modal content" })] }) }));
    });
    it('renders modal with header and footer', function () {
        assertSnapshot(_jsxs(Modal, { isOpen: true, onClose: function () { }, children: [_jsxs(Modal.Header, { children: [_jsx(Modal.Title, { children: "Modal Title" }), _jsx(Modal.Description, { children: "This is a modal description" })] }), _jsx(Modal.Content, { children: _jsx("p", { children: "Modal content goes here" }) }), _jsxs(Modal.Footer, { children: [_jsx(Button, { variant: "outline", onClick: function () { }, children: "Cancel" }), _jsx(Button, { onClick: function () { }, children: "Confirm" })] })] }));
    });
    it('renders modal with custom width', function () {
        assertSnapshot(_jsx(Modal, { isOpen: true, onClose: function () { }, className: "max-w-2xl", children: _jsx(Modal.Content, { children: _jsx("p", { children: "Wide modal content" }) }) }));
    });
    it('renders modal with close button', function () {
        assertSnapshot(_jsx(Modal, { isOpen: true, onClose: function () { }, showCloseButton: true, children: _jsx(Modal.Content, { children: _jsx("p", { children: "Modal with close button" }) }) }));
    });
    it('renders modal with custom overlay styles', function () {
        assertSnapshot(_jsx(Modal, { isOpen: true, onClose: function () { }, overlayClassName: "bg-black/80 backdrop-blur-sm", children: _jsx(Modal.Content, { children: _jsx("p", { children: "Modal with custom overlay" }) }) }));
    });
});
