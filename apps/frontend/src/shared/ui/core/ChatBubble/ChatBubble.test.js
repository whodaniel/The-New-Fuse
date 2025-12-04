import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@/test/helpers/render';
import { ChatBubble } from './ChatBubble';
import { describe, it, expect, vi } from 'vitest';
describe('ChatBubble', function () {
    it('renders message content', function () {
        render(_jsx(ChatBubble, { message: "Test message" }));
        expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    it('applies alignment classes correctly', function () {
        var container = render(_jsx(ChatBubble, { message: "Test", align: "right" })).container;
        expect(container.firstChild).toHaveClass('justify-end');
    });
    it('shows timestamp when provided', function () {
        var timestamp = new Date().toISOString();
        render(_jsx(ChatBubble, { message: "Test", timestamp: timestamp }));
        expect(screen.getByText(new Date(timestamp).toLocaleTimeString())).toBeInTheDocument();
    });
    it('handles edit mode', function () {
        var onEdit = vi.fn();
        render(_jsx(ChatBubble, { message: "Test", onEdit: onEdit, editable: true }));
        var editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);
        var input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('Test');
        fireEvent.change(input, { target: { value: 'Updated message' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onEdit).toHaveBeenCalledWith('Updated message');
    });
    it('shows status indicator when provided', function () {
        render(_jsx(ChatBubble, { message: "Test", status: "sending" }));
        expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });
    it('applies variant styles correctly', function () {
        var container = render(_jsx(ChatBubble, { message: "Test", variant: "primary" })).container;
        expect(container.firstChild).toHaveClass('bg-primary');
    });
    it('handles custom actions', function () {
        var onAction = vi.fn();
        render(_jsx(ChatBubble, { message: "Test", actions: [
                { label: 'Custom', onClick: onAction }
            ] }));
        var actionButton = screen.getByRole('button', { name: /custom/i });
        fireEvent.click(actionButton);
        expect(onAction).toHaveBeenCalled();
    });
});
