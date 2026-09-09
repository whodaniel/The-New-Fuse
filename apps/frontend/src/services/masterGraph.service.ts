import { buildAuthHeaders } from '@/utils/authToken';
import { parseMasterGraph, type MasterGraph } from '../../shared/master-graph';

export async function fetchMasterGraph(signal?: AbortSignal): Promise<MasterGraph> {
  // This endpoint belongs to the app's Pages Function, not API_BASE's backend proxy.
  const response = await fetch('/api/master-graph', {
    headers: await buildAuthHeaders({ Accept: 'application/json' }),
    credentials: 'include',
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(`Master graph unavailable (HTTP ${response.status})`);
  if (!response.headers.get('content-type')?.includes('json'))
    throw new Error('Master graph endpoint returned a page instead of JSON');
  return parseMasterGraph(await response.json());
}
