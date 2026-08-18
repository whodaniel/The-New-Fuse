import { EnhancedFloatingPanel } from '../FloatingPanel';

/**
 * Regression tests for:
 *
 *   Uncaught TypeError: Cannot read properties of undefined (reading 'length')
 *   [FuseConnect] Content script message handler error: TypeError: ...
 *
 * The panel renders wire data straight into HTML. A relay message with no
 * `from`, a channel with no `members`, or a task with no `instructions` threw
 * inside render(), which runs inside the content script's chrome.runtime
 * message handler — so one malformed frame took down the whole panel.
 */

// Render helpers are private; drive them directly against an instance whose
// state we can set, without going through inject()/DOM lifecycle.
type PanelInternals = {
  messages: unknown[];
  channels: unknown[];
  tasks: unknown[];
  agents: unknown[];
  myAgentId: string | null;
  currentChannel: string | null;
  renderChatMessagesHtml(): string;
  renderChannelsTab(): string;
  renderTasksTab(): string;
};

function barePanel(): PanelInternals {
  const panel = Object.create(EnhancedFloatingPanel.prototype) as PanelInternals;
  panel.messages = [];
  panel.channels = [];
  panel.tasks = [];
  panel.agents = [];
  panel.myAgentId = 'page-agent-1';
  panel.currentChannel = 'green';
  return panel;
}

describe('panel renders malformed wire data without throwing', () => {
  it('renders a message with no `from` and no sender metadata', () => {
    const panel = barePanel();
    panel.messages = [
      { id: 'm1', content: 'hello from nowhere', timestamp: Date.now(), type: 'text' },
    ];

    let html = '';
    expect(() => {
      html = panel.renderChatMessagesHtml();
    }).not.toThrow();

    expect(html).toContain('hello from nowhere');
    // Falls back rather than printing "undefined" at the user.
    expect(html).toContain('unknown-id');
    expect(html).not.toContain('>undefined<');
  });

  it('renders a message whose metadata.senderId is not a string', () => {
    const panel = barePanel();
    panel.messages = [
      {
        id: 'm2',
        from: undefined,
        content: 'numeric sender id',
        timestamp: Date.now(),
        type: 'text',
        metadata: { senderId: 12345 },
      },
    ];

    expect(() => panel.renderChatMessagesHtml()).not.toThrow();
  });

  it('still renders a well-formed federated message normally', () => {
    const panel = barePanel();
    panel.messages = [
      {
        id: 'm3',
        from: 'page-agent-791482685-qdcr2',
        content: 'Testing the Green channel',
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          senderId: 'page-agent-791482685-qdcr2',
          idNumber: 'ID#:3a6sK9',
          operationalHandle: 'PAGE-791482685-QDCR2',
        },
      },
    ];

    const html = panel.renderChatMessagesHtml();
    expect(html).toContain('Testing the Green channel');
    expect(html).toContain('@ID#:3a6sK9');
    expect(html).toContain('PAGE-791482685-QDCR2');
  });

  it('renders a channel that arrived without a members array', () => {
    const panel = barePanel();
    panel.channels = [{ id: 'green', name: 'Green', isPrivate: false }];

    let html = '';
    expect(() => {
      html = panel.renderChannelsTab();
    }).not.toThrow();

    expect(html).toContain('Green');
    expect(html).toContain('0 active agents');
  });

  it('renders a task that arrived without an instructions array', () => {
    const panel = barePanel();
    panel.tasks = [
      {
        id: 'task-1',
        title: 'Verify federation',
        description: 'check the green channel',
        type: 'verification',
        priority: 'high',
        createdAt: Date.now(),
      },
    ];

    let html = '';
    expect(() => {
      html = panel.renderTasksTab();
    }).not.toThrow();

    expect(html).toContain('Verify federation');
  });
});
