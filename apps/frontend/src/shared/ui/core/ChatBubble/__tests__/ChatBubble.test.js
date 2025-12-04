var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@/test/helpers/render';
import { ChatBubble } from '../ChatBubble';
import { vi } from 'vitest';
describe('ChatBubble', function () {
    var defaultProps = {
        message: 'Test message',
        type: 'user',
    };
    it('renders correctly with default props', function () {
        render(_jsx(ChatBubble, __assign({}, defaultProps)));
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('common.user')).toBeInTheDocument();
    });
    it('applies correct alignment based on type', function () {
        var container = render(_jsx(ChatBubble, __assign({}, defaultProps))).container;
        expect(container.querySelector('.justify-end')).toBeInTheDocument();
        var container2 = render(_jsx(ChatBubble, __assign({}, defaultProps, { type: "assistant" }))).container;
        expect(container2.querySelector('.justify-start')).toBeInTheDocument();
    });
    it('handles editing when editable prop is true', function () {
        var onMessageChange = vi.fn();
        render(_jsx(ChatBubble, __assign({}, defaultProps, { editable: true, index: 0, onMessageChange: onMessageChange })));
        var messageElement = screen.getByText('Test message');
        fireEvent.doubleClick(messageElement);
        var input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('Test message');
        fireEvent.change(input, { target: { value: 'Edited message' } });
        fireEvent.blur(input);
        expect(onMessageChange).toHaveBeenCalledWith(0, 'user', 'Edited message');
    });
    it('applies custom className', function () {
        var container = render(_jsx(ChatBubble, __assign({}, defaultProps, { className: "custom-class" }))).container;
        var element = container.firstChild;
        expect(element.className).toContain('custom-class');
    });
    it('handles message removal', function () {
        var onMessageRemove = vi.fn();
        render(_jsx(ChatBubble, __assign({}, defaultProps, { index: 0, onMessageRemove: onMessageRemove })));
        var removeButton = screen.getByRole('button', { name: /remove/i });
        fireEvent.click(removeButton);
        expect(onMessageRemove).toHaveBeenCalledWith(0);
    });
    it('displays timestamp when provided', function () {
        var timestamp = new Date('2025-01-01T12:00:00');
        render(_jsx(ChatBubble, __assign({}, defaultProps, { timestamp: timestamp })));
        expect(screen.getByText(/12:00/)).toBeInTheDocument();
    });
    it('handles custom actions', function () {
        var handleAction = vi.fn();
        render(_jsx(ChatBubble, __assign({}, defaultProps, { actions: _jsx("button", { onClick: handleAction, children: "Custom Action" }) })));
        var actionButton = screen.getByText('Custom Action');
        fireEvent.click(actionButton);
        expect(handleAction).toHaveBeenCalled();
    });
    it('shows status icon when status is provided', function () {
        var rerender = render(_jsx(ChatBubble, __assign({}, defaultProps, { status: "sending" }))).rerender;
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
        rerender(_jsx(ChatBubble, __assign({}, defaultProps, { status: "sent" })));
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
        rerender(_jsx(ChatBubble, __assign({}, defaultProps, { status: "error" })));
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
        rerender(_jsx(ChatBubble, __assign({}, defaultProps, { status: "edited" })));
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    });
    it('shows timestamp when provided', function () {
        render(_jsx(ChatBubble, __assign({}, defaultProps, { timestamp: "12:34" })));
        expect(screen.getByText('12:34')).toBeInTheDocument();
    });
    it('shows status icon when provided', function () {
        var rerender = render(_jsx(ChatBubble, __assign({}, defaultProps, { status: "sending" }))).rerender;
        expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
        rerender(_jsx(ChatBubble, __assign({}, defaultProps, { status: "sent" })));
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
    it('renders custom actions when provided', function () {
        var CustomAction = function () { return _jsx("button", { children: "Custom Action" }); };
        render(_jsx(ChatBubble, __assign({}, defaultProps, { actions: _jsx(CustomAction, {}) })));
        expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
    it('handles keyboard interactions in edit mode', function () {
        var onMessageChange = vi.fn();
        render(_jsx(ChatBubble, __assign({}, defaultProps, { editable: true, index: 0, onMessageChange: onMessageChange })));
        var messageElement = screen.getByText('Test message');
        fireEvent.doubleClick(messageElement);
        var input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Edited message' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onMessageChange).toHaveBeenCalledWith(0, 'user', 'Edited message');
        fireEvent.doubleClick(messageElement);
        fireEvent.change(input, { target: { value: 'Cancel this' } });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.getByText('Edited message')).toBeInTheDocument();
    });
});
