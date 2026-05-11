import { describe, expect, it } from 'vitest';
import codebaseMap from '../../data/codebase_map.json';

describe('Parser-generated auth matrix', () => {
  const nodes = codebaseMap.nodes as Array<{
    id: string;
    data: { label?: string; requiredRole?: string | null };
  }>;

  it('has 7 nodes with requiredRole locks', () => {
    const locked = nodes.filter((n) => n.data.requiredRole);
    expect(locked).toHaveLength(7);
  });

  it('exposes governance protocol with SUPER_ADMIN', () => {
    const governance = nodes.find(
      (n) => n.data.label?.toUpperCase().includes('GOVERNANCE') && n.id.startsWith('PROTO_')
    );
    expect(governance).toBeDefined();
    expect(governance!.data.requiredRole).toBe('SUPER_ADMIN');
  });

  it('exposes living state protocol with ADMIN', () => {
    const livingState = nodes.find(
      (n) => n.data.label?.toUpperCase().includes('LIVING_STATE') && n.id.startsWith('PROTO_')
    );
    expect(livingState).toBeDefined();
    expect(livingState!.data.requiredRole).toBe('ADMIN');
  });

  it('exposes agents domain with DEVELOPER', () => {
    const agentsDomain = nodes.find((n) => n.id === 'DOMAIN_AGENTS');
    expect(agentsDomain).toBeDefined();
    expect(agentsDomain!.data.requiredRole).toBe('DEVELOPER');
  });

  it('exposes the first agent skill with DEVELOPER', () => {
    const skill = nodes.find((n) => n.id === 'AGENT_SKILL_0');
    expect(skill).toBeDefined();
    expect(skill!.data.requiredRole).toBe('DEVELOPER');
  });

  it('does NOT assign requiredRole to code files (e.g. SecurityScanner)', () => {
    const securityNode = nodes.find((n) => n.data.label === 'Class: SecurityScanner');
    if (securityNode) {
      expect(securityNode.data.requiredRole).toBeNull();
    }
  });
});
