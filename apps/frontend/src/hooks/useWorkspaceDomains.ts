import {
  workspaceDomainsService,
  type WorkspaceDomain,
  type WorkspaceDomainsMap,
} from '@/services/workspaceDomains.service';
import { useCallback, useEffect, useMemo, useState } from 'react';

const sortDomains = (domains: WorkspaceDomain[]): WorkspaceDomain[] =>
  [...domains].sort((a, b) => {
    const aVerified = a.status === 'verified' ? 1 : 0;
    const bVerified = b.status === 'verified' ? 1 : 0;
    if (aVerified !== bVerified) return bVerified - aVerified;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

const normalizeDomainInput = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';

  let withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  withoutProtocol = withoutProtocol.split('/')[0];
  if (withoutProtocol.startsWith('www.')) {
    withoutProtocol = withoutProtocol.slice(4);
  }
  return withoutProtocol;
};

const isValidDomain = (value: string): boolean =>
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value);

export type DomainSyncState = 'syncing' | 'synced' | 'error';

export function useWorkspaceDomains() {
  const [domainsByWorkspace, setDomainsByWorkspace] = useState<WorkspaceDomainsMap>({});
  const [syncState, setSyncState] = useState<DomainSyncState>('syncing');
  const [loading, setLoading] = useState(true);

  const hydrateDomains = useCallback(async (): Promise<WorkspaceDomainsMap> => {
    setSyncState('syncing');
    const map = await workspaceDomainsService.getAllWorkspaceDomains();
    setDomainsByWorkspace(map);
    setSyncState('synced');
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      setLoading(true);
      try {
        const map = await workspaceDomainsService.getAllWorkspaceDomains();
        if (cancelled) return;
        setDomainsByWorkspace(map);
        setSyncState('synced');
      } catch {
        if (cancelled) return;
        setSyncState('error');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const getDomainsForWorkspace = useCallback(
    (workspaceId: string): WorkspaceDomain[] => sortDomains(domainsByWorkspace[workspaceId] || []),
    [domainsByWorkspace]
  );

  const addDomain = useCallback(
    async (
      workspaceId: string,
      rawDomain: string
    ): Promise<{ state: DomainSyncState; domain: WorkspaceDomain }> => {
      const domain = normalizeDomainInput(rawDomain);
      if (!domain || !isValidDomain(domain)) {
        throw new Error('Enter a valid domain (example.com)');
      }

      const current = getDomainsForWorkspace(workspaceId);
      if (current.some((entry) => entry.domain === domain)) {
        throw new Error('Domain already exists for this workspace');
      }

      setSyncState('syncing');
      try {
        const created = await workspaceDomainsService.addDomain(workspaceId, domain);
        setDomainsByWorkspace((previous) => ({
          ...previous,
          [workspaceId]: sortDomains([created, ...(previous[workspaceId] || [])]),
        }));
        setSyncState('synced');
        return { state: 'synced', domain: created };
      } catch (error) {
        setSyncState('error');
        throw error;
      }
    },
    [getDomainsForWorkspace]
  );

  const removeDomain = useCallback(async (workspaceId: string, domainId: string): Promise<DomainSyncState> => {
    setSyncState('syncing');
    try {
      await workspaceDomainsService.removeDomain(workspaceId, domainId);
      setDomainsByWorkspace((previous) => {
        const current = previous[workspaceId] || [];
        const next = current.filter((entry) => entry.id !== domainId);
        const map = { ...previous };
        if (next.length > 0) {
          map[workspaceId] = next;
        } else {
          delete map[workspaceId];
        }
        return map;
      });
      setSyncState('synced');
      return 'synced';
    } catch (error) {
      setSyncState('error');
      throw error;
    }
  }, []);

  const verifyDomain = useCallback(
    async (
      workspaceId: string,
      domainId: string
    ): Promise<{ state: DomainSyncState; domain: WorkspaceDomain }> => {
      setSyncState('syncing');
      try {
        const verified = await workspaceDomainsService.verifyDomain(workspaceId, domainId);
        setDomainsByWorkspace((previous) => {
          const current = previous[workspaceId] || [];
          const next = current.map((entry) => (entry.id === domainId ? verified : entry));
          return {
            ...previous,
            [workspaceId]: sortDomains(next),
          };
        });
        setSyncState('synced');
        return { state: 'synced', domain: verified };
      } catch (error) {
        setSyncState('error');
        throw error;
      }
    },
    []
  );

  const refreshDomains = useCallback(async (): Promise<DomainSyncState> => {
    try {
      await hydrateDomains();
      return 'synced';
    } catch {
      setSyncState('error');
      return 'error';
    }
  }, [hydrateDomains]);

  const totalDomains = useMemo(
    () => Object.values(domainsByWorkspace).reduce((sum, entries) => sum + entries.length, 0),
    [domainsByWorkspace]
  );

  return {
    domainsByWorkspace,
    loading,
    syncState,
    totalDomains,
    getDomainsForWorkspace,
    addDomain,
    removeDomain,
    verifyDomain,
    refreshDomains,
  };
}
