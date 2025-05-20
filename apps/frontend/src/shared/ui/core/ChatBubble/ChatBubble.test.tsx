import { render, screen, fireEvent } from '@/test/helpers/render';
import { ChatBubble } from './ChatBubble.js';
import { describe, it, expect, vi } from 'vitest';
describe('ChatBubble', () => {
    it('renders message content', () => {
        render(<ChatBubble message="Test message"/>);
        expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    it('applies alignment classes correctly', () => {
        const { container } = render(<ChatBubble message="Test" align="right"/>);
        expect(container.firstChild).toHaveClass('justify-end');
    });
    it('shows timestamp when provided', () => {
        const timestamp = new Date().toISOString();
        render(<ChatBubble message="Test" timestamp={timestamp}/>);
        expect(screen.getByText(new Date(timestamp).toLocaleTimeString())).toBeInTheDocument();
    });
    it('handles edit mode', () => {
        const onEdit = vi.fn();
        render(<ChatBubble message="Test" onEdit={onEdit} editable/>);
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('Test');
        fireEvent.change(input, { target: { value: 'Updated message' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onEdit).toHaveBeenCalledWith('Updated message');
    });
    it('shows status indicator when provided', () => {
        render(<ChatBubble message="Test" status="sending"/>);
        expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });
    it('applies variant styles correctly', () => {
        const { container } = render(<ChatBubble message="Test" variant="primary"/>);
        expect(container.firstChild).toHaveClass('bg-primary');
    });
    it('handles custom actions', () => {
        const onAction = vi.fn();
        render(<ChatBubble message="Test" actions={[
                { label: 'Custom', onClick: onAction }
            ]}/>);
        const actionButton = screen.getByRole('button', { name: /custom/i });
        fireEvent.click(actionButton);
        expect(onAction).toHaveBeenCalled();
    });
});
//# sourceMappingURL=ChatBubble.test.js.map