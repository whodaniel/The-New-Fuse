import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

const NEXUS_LAYERS = new Set([
  'topology',
  'semantic',
  'forge',
  'memory',
  'lexicon',
  'activity',
  'metrics',
]);

function mapObservatoryLayer(rawLayer: string | null, rawTab: string | null): string {
  const normalizedLayer = String(rawLayer || '').toLowerCase();
  if (NEXUS_LAYERS.has(normalizedLayer)) return normalizedLayer;

  const tab = String(rawTab || '').toLowerCase();
  switch (tab) {
    case 'topology':
      return 'topology';
    case 'semantic':
      return 'semantic';
    case 'graphs':
      return 'forge';
    case 'metrics':
      return 'metrics';
    default:
      return 'topology';
  }
}

export const SystemObservatory: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const nextParams = new URLSearchParams(searchParams);
  const targetLayer = mapObservatoryLayer(searchParams.get('layer'), searchParams.get('tab'));

  nextParams.set('layer', targetLayer);
  nextParams.delete('tab');
  nextParams.set('from', 'observatory');

  const query = nextParams.toString();
  const target = query.length > 0 ? `/workflows/nexus?${query}` : '/workflows/nexus';

  return <Navigate to={target} replace state={{ redirectedFrom: location.pathname }} />;
};

export default SystemObservatory;
