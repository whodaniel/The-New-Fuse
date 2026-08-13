import type { TerminalGraphQuery, TerminalGraphResponse } from '@/types/terminal-graph';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token');

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQueryString(query: TerminalGraphQuery): string {
  const search = new URLSearchParams();

  if (query.tenantId) search.set('tenantId', query.tenantId);
  if (typeof query.limit === 'number') search.set('limit', String(query.limit));
  if (typeof query.includeCommands === 'boolean') {
    search.set('includeCommands', String(query.includeCommands));
  }
  if (typeof query.includeProcessNodes === 'boolean') {
    search.set('includeProcessNodes', String(query.includeProcessNodes));
  }

  const raw = search.toString();
  return raw ? `?${raw}` : '';
}

export async function fetchTerminalGraph(
  query: TerminalGraphQuery = {}
): Promise<TerminalGraphResponse> {
  const response = await fetch(`/api/terminals/graph${buildQueryString(query)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Terminal graph request failed (${response.status})`);
  }

  return (await response.json()) as TerminalGraphResponse;
}

