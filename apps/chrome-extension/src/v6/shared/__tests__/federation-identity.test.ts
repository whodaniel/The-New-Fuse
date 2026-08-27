import {
  a2aChannelIdForTab,
  buildPageAgentIdentity,
  buildSidePanelAgentIdentity,
  enrichOutboundMetadata,
  resolveMessageTarget,
} from '../federation-identity';
import type { Agent } from '../types';

describe('federation identity', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => '00000000-0000-4000-8000-000000000000',
      },
      configurable: true,
    });
  });

  it('assigns Kimi page agents a first-class federated identity', () => {
    const identity = buildPageAgentIdentity('page-agent-42-kimi1', 'www.kimi.com', 42);

    expect(identity.operationalHandle).toBe('PAGE-42-KIMI1');
    expect(identity.idNumber).toMatch(/^ID#:/);
    expect(identity.canonicalEntityId).toBe('TNF:LOCAL:AGENT:FUSE:MOONSHOT_KIMI_PAGE:042');
    expect(identity.aliases).toContain('www.kimi.com');
    expect(identity.aliases).toContain('tnf:local:agent:fuse:moonshot_kimi_page:042');
  });

  it('assigns Cursor page agents a first-class federated identity', () => {
    const identity = buildPageAgentIdentity('page-agent-9-cursor1', 'www.cursor.com', 9);

    expect(identity.canonicalEntityId).toBe('TNF:LOCAL:AGENT:FUSE:CURSOR_PAGE:009');
    expect(identity.aliases).toContain('www.cursor.com');
  });

  it('enriches outbound channel metadata with ID number and MCID', () => {
    const identity = buildPageAgentIdentity('page-agent-7-green1', 'gemini.google.com', 7);
    const metadata = enrichOutboundMetadata(identity, {
      channel: 'green',
      senderId: identity.id,
      extra: { source: 'floating-panel' },
    });

    expect(metadata.senderId).toBe('page-agent-7-green1');
    expect(metadata.operationalHandle).toBe('PAGE-7-GREEN1');
    expect(metadata.idNumber).toMatch(/^ID#:/);
    expect(metadata.federation).toMatchObject({
      canonicalEntityId: 'TNF:LOCAL:AGENT:FUSE:GOOGLE_GEMINI_PAGE:007',
      idNumber: metadata.idNumber,
    });
    expect((metadata.mcid as any).scope.channel_id).toBe('green');
  });

  it('routes @Kimi mentions by platform alias', () => {
    const identity = buildPageAgentIdentity('page-agent-44-blue1', 'www.kimi.com', 44);
    const agent: Agent = {
      id: identity.id,
      name: 'AI Chat (Kimi)',
      platform: 'browser-page',
      status: 'active',
      capabilities: [],
      lastSeen: Date.now(),
      operationalHandle: identity.operationalHandle,
      runtimeSessionId: identity.runtimeSessionId,
      canonicalEntityId: identity.canonicalEntityId,
      idNumber: identity.idNumber,
      aliases: identity.aliases,
      daccRole: identity.daccRole,
      correlationId: identity.correlationId,
      mcid: identity.mcid,
      metadata: {
        node: { platform: 'www.kimi.com' },
        aliases: identity.aliases,
      },
    };

    const routed = resolveMessageTarget('@Kimi test Blue channel routing', [agent]);

    expect(routed.to).toBe('page-agent-44-blue1');
    expect(routed.addressedHandle).toBe('PAGE-44-BLUE1');
    expect(routed.content).toBe('test Blue channel routing');
  });

  it('assigns side-panel agents the same ID# / role contract as page chat', () => {
    const identity = buildSidePanelAgentIdentity(
      'side-panel-agent-42-glm1',
      'chat.z.ai',
      42
    );

    expect(identity.operationalHandle).toBe('SIDEPANEL-42-GLM1');
    expect(identity.idNumber).toMatch(/^ID#:/);
    expect(identity.daccRole).toBe('participant');
    expect(identity.canonicalEntityId).toBe('TNF:LOCAL:AGENT:FUSE:ZHIPU_GLM_SIDEPANEL:042');
    expect(identity.aliases).toContain('sidepanel');
    expect(a2aChannelIdForTab(42)).toBe('a2a-tab-42');
  });

  it('routes @ID#: and @side-panel-agent mentions to the side-panel agent', () => {
    const identity = buildSidePanelAgentIdentity(
      'side-panel-agent-9-cursor1',
      'www.cursor.com',
      9
    );
    const agent: Agent = {
      id: identity.id,
      name: 'Side Panel (Cursor)',
      platform: 'browser-side-panel',
      status: 'active',
      capabilities: [],
      lastSeen: Date.now(),
      operationalHandle: identity.operationalHandle,
      runtimeSessionId: identity.runtimeSessionId,
      canonicalEntityId: identity.canonicalEntityId,
      idNumber: identity.idNumber,
      aliases: identity.aliases,
      daccRole: identity.daccRole,
      correlationId: identity.correlationId,
      mcid: identity.mcid,
      metadata: {
        node: { platform: 'www.cursor.com' },
        aliases: identity.aliases,
      },
    };

    const byId = resolveMessageTarget(`@${identity.idNumber} hello from page`, [agent]);
    expect(byId.to).toBe(identity.id);
    expect(byId.content).toBe('hello from page');

    const byHandle = resolveMessageTarget('@side-panel-agent-9-cursor1 ping', [agent]);
    expect(byHandle.to).toBe(identity.id);
  });
});
