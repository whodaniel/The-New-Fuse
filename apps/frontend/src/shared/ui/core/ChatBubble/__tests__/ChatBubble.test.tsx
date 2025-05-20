import React from 'react';
import { render, screen, fireEvent } from '@/test/helpers/render';
import { ChatBubble } from '../ChatBubble.js';
import { vi } from 'vitest';
describe('ChatBubble', () => {
    const defaultProps = {
        message: 'Test message',
        type: 'user',
    };
    it('renders correctly with default props', () => {
        render(<ChatBubble {...defaultProps}/>);
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('common.user')).toBeInTheDocument();
    });
    it('applies correct alignment based on type', () => {
        const { container } = render(<ChatBubble {...defaultProps}/>);
        expect(container.querySelector('.justify-end')).toBeInTheDocument();
        const { container: container2 } = render(<ChatBubble {...defaultProps} type="assistant"/>);
        expect(container2.querySelector('.justify-start')).toBeInTheDocument();
    });
    it('handles editing when editable prop is true', () => {
        const onMessageChange = vi.fn();
        render(<ChatBubble {...defaultProps} editable index={0} onMessageChange={onMessageChange}/>);
        const messageElement = screen.getByText('Test message');
        fireEvent.doubleClick(messageElement);
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('Test message');
        fireEvent.change(input, { target: { value: 'Edited message' } });
        fireEvent.blur(input);
        expect(onMessageChange).toHaveBeenCalledWith(0, 'user', 'Edited message');
    });
    it('applies custom className', () => {
        const { container } = render(<ChatBubble {...defaultProps} className="custom-class"/>);
        const element = container.firstChild;
        expect(element.className).toContain('custom-class');
    });
    it('handles message removal', () => {
        const onMessageRemove = vi.fn();
        render(<ChatBubble {...defaultProps} index={0} onMessageRemove={onMessageRemove}/>);
        const removeButton = screen.getByRole('button', { name: /remove/i });
        fireEvent.click(removeButton);
        expect(onMessageRemove).toHaveBeenCalledWith(0);
    });
    it('displays timestamp when provided', () => {
        const timestamp = new Date('2025-01-01T12:00:00');
        render(<ChatBubble {...defaultProps} timestamp={timestamp}/>);
        expect(screen.getByText(/12:00/)).toBeInTheDocument();
    });
    it('handles custom actions', () => {
        const handleAction = vi.fn();
        render(<ChatBubble {...defaultProps} actions={<button onClick={handleAction}>Custom Action</button>}/>);
        const actionButton = screen.getByText('Custom Action');
        fireEvent.click(actionButton);
        expect(handleAction).toHaveBeenCalled();
    });
    it('shows status icon when status is provided', () => {
        const { rerender } = render(<ChatBubble {...defaultProps} status="sending"/>);
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
        rerender(<ChatBubble {...defaultProps} status="sent"/>);
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
        rerender(<ChatBubble {...defaultProps} status="error"/>);
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
        rerender(<ChatBubble {...defaultProps} status="edited"/>);
        expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    });
    it('shows timestamp when provided', () => {
        render(<ChatBubble {...defaultProps} timestamp="12:34"/>);
        expect(screen.getByText('12:34')).toBeInTheDocument();
    });
    it('shows status icon when provided', () => {
        const { rerender } = render(<ChatBubble {...defaultProps} status="sending"/>);
        expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
        rerender(<ChatBubble {...defaultProps} status="sent"/>);
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
    it('renders custom actions when provided', () => {
        const CustomAction = (): any => <button>Custom Action</button>;
        render(<ChatBubble {...defaultProps} actions={<CustomAction />}/>);
        expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
    it('handles keyboard interactions in edit mode', () => {
        const onMessageChange = vi.fn();
        render(<ChatBubble {...defaultProps} editable index={0} onMessageChange={onMessageChange}/>);
        const messageElement = screen.getByText('Test message');
        fireEvent.doubleClick(messageElement);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Edited message' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onMessageChange).toHaveBeenCalledWith(0, 'user', 'Edited message');
        fireEvent.doubleClick(messageElement);
        fireEvent.change(input, { target: { value: 'Cancel this' } });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.getByText('Edited message')).toBeInTheDocument();
    });
});
//# sourceMappingURL=ChatBubble.test.js.map