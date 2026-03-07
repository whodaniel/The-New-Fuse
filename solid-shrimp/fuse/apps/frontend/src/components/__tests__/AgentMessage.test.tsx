// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AgentMessage from '../agent-message';

describe('AgentMessage Component', () => {
  const mockAgent = {
    id: 'agent1',
    name: 'Test Agent',
    avatar: 'https://example.com/avatar.png',
  };

  const mockMessage = {
    id: 'msg1',
    content: 'Hello, world!',
    timestamp: '2023-01-01T12:00:00Z',
    type: 'text' as const,
    agent: mockAgent,
  };

  it('renders text message correctly', () => {
    render(<AgentMessage agent={mockAgent} message={mockMessage} isCurrentUser={false} />);

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    // Use flexible matching for time since it depends on local time
    expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
  });

  it('renders code message correctly', () => {
    const codeMessage = {
      ...mockMessage,
      type: 'code' as const,
      content: 'console.log("Hello");',
    };

    render(<AgentMessage agent={mockAgent} message={codeMessage} isCurrentUser={false} />);

    const codeElement = screen.getByText('console.log("Hello");');
    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement.closest('pre')).toBeInTheDocument();
  });

  it('renders image message correctly', () => {
    const imageMessage = {
      ...mockMessage,
      type: 'image' as const,
      content: 'https://example.com/image.png',
      metadata: { alt: 'Test Image' },
    };

    render(<AgentMessage agent={mockAgent} message={imageMessage} isCurrentUser={false} />);

    const imgElement = screen.getByAltText('Test Image');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', 'https://example.com/image.png');
  });

  it('renders message from current user on the right side', () => {
    const { container } = render(
      <AgentMessage agent={mockAgent} message={mockMessage} isCurrentUser={true} />
    );

    // Look for the flex-row-reverse class applied by cn when isCurrentUser is true
    // Note: Since we don't know the exact class structure of Card, we check if the outer div has the class
    // In the component: className={cn('flex w-full max-w-md gap-2 p-4', isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
    // So we can check for flex-row-reverse

    // We can query by role or just check container's first child
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('flex-row-reverse');
    expect(card.className).toContain('ml-auto');
  });

  it('renders message from other agent on the left side', () => {
    const { container } = render(
      <AgentMessage agent={mockAgent} message={mockMessage} isCurrentUser={false} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('flex-row-reverse');
    expect(card.className).toContain('mr-auto');
  });
});
