import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/safeStorage', () => {
  const store = new Map<string, string>();
  return {
    safeStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      __clear: () => store.clear(),
    },
  };
});

import { MAX_CHAT_SESSIONS, MAX_MESSAGES_PER_SESSION, useChatStore } from './chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: [],
      activeSessionId: null,
      mode: 'broadcast',
      temperature: 0.7,
      useLocalFallback: true,
    });
  });

  it('creates a new session and sets it active', () => {
    const id = useChatStore.getState().createSession('Test Session', ['agent-1']);
    const state = useChatStore.getState();

    expect(state.sessions).toHaveLength(1);
    expect(state.activeSessionId).toBe(id);
    expect(state.sessions[0].title).toBe('Test Session');
    expect(state.sessions[0].agents).toEqual(['agent-1']);
  });

  it('adds, updates, and deletes messages in a session', () => {
    const id = useChatStore.getState().createSession('Workspace Chat');

    useChatStore.getState().addMessage(id, {
      id: 'msg-1',
      role: 'user',
      content: 'Hello swarm!',
      timestamp: new Date().toISOString(),
    });

    let session = useChatStore.getState().sessions.find((s) => s.id === id);
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0].content).toBe('Hello swarm!');

    useChatStore.getState().updateMessage(id, 'msg-1', { content: 'Hello updated swarm!' });
    session = useChatStore.getState().sessions.find((s) => s.id === id);
    expect(session?.messages[0].content).toBe('Hello updated swarm!');

    useChatStore.getState().deleteMessage(id, 'msg-1');
    session = useChatStore.getState().sessions.find((s) => s.id === id);
    expect(session?.messages).toHaveLength(0);
  });

  it('exports session to Markdown and JSON formats', () => {
    const id = useChatStore.getState().createSession('Exportable Session');
    useChatStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'What is TNF?',
      timestamp: '2026-08-09T18:00:00.000Z',
    });

    const jsonExport = useChatStore.getState().exportSession(id, 'json');
    expect(jsonExport).toContain('What is TNF?');

    const mdExport = useChatStore.getState().exportSession(id, 'markdown');
    expect(mdExport).toContain('# What is TNF?');
    expect(mdExport).toContain('What is TNF?');
  });

  it('deletes a session and handles active fallback', () => {
    const id1 = useChatStore.getState().createSession('Session 1');
    const id2 = useChatStore.getState().createSession('Session 2');

    expect(useChatStore.getState().activeSessionId).toBe(id2);

    useChatStore.getState().deleteSession(id2);
    expect(useChatStore.getState().sessions).toHaveLength(1);
    expect(useChatStore.getState().activeSessionId).toBe(id1);
  });

  it('caps messages per session and total sessions', () => {
    for (let i = 0; i < MAX_CHAT_SESSIONS + 5; i += 1) {
      useChatStore.getState().createSession(`Session ${i}`);
    }
    expect(useChatStore.getState().sessions.length).toBeLessThanOrEqual(MAX_CHAT_SESSIONS);

    const id = useChatStore.getState().createSession('Overflow Messages');
    for (let i = 0; i < MAX_MESSAGES_PER_SESSION + 25; i += 1) {
      useChatStore.getState().addMessage(id, {
        id: `msg-${i}`,
        role: 'user',
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      });
    }
    const session = useChatStore.getState().sessions.find((s) => s.id === id);
    expect(session?.messages).toHaveLength(MAX_MESSAGES_PER_SESSION);
    expect(session?.messages[0].content).toBe('Message 25');
  });
});
