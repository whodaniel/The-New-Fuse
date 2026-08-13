// @ts-nocheck
import { useLibraryStore } from '../../store';

export default function HUD() {
  const playerPosition = useLibraryStore((s) => s.playerPosition);
  const nearestShelfCode = useLibraryStore((s) => s.nearestShelfCode);
  const nearestShelfLabel = useLibraryStore((s) => s.nearestShelfLabel);
  const isPointerLocked = useLibraryStore((s) => s.isPointerLocked);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const setNavigationTarget = useLibraryStore((s) => s.setNavigationTarget);
  const setPointerLocked = useLibraryStore((s) => s.setPointerLocked);

  const handleSearch = () => {
    const code = searchQuery.trim();
    if (!code) return;
    const SHELF_POSITIONS: Record<string, { x: number; z: number }> = {
      '000': { x: -14.5, z: -8 },
      '200': { x: -14.5, z: -4 },
      '400': { x: -14.5, z: 0 },
      '600': { x: -14.5, z: 4 },
      '800': { x: -14.5, z: 8 },
      '100': { x: 14.5, z: -8 },
      '300': { x: 14.5, z: -4 },
      '500': { x: 14.5, z: 0 },
      '700': { x: 14.5, z: 4 },
      '900': { x: 14.5, z: 8 },
    };
    const pos = SHELF_POSITIONS[code];
    if (!pos) return;
    const offsetX = pos.x > 0 ? -2 : 2;
    setNavigationTarget({ x: pos.x + offsetX, y: 1.65, z: pos.z });
    setSearchQuery('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        pointerEvents: 'none',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <div style={{ color: '#8a7560', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Location
        </div>
        <div style={{ color: '#f0d9b5', fontSize: '15px', marginBottom: '8px' }}>
          {playerPosition.x.toFixed(1)}, {playerPosition.z.toFixed(1)}
        </div>

        <div style={{ color: '#8a7560', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Nearest Section
        </div>
        <div style={{ color: '#f0d9b5', fontSize: '15px', marginBottom: '8px' }}>
          {nearestShelfCode && nearestShelfLabel
            ? `${nearestShelfCode} — ${nearestShelfLabel}`
            : '—'}
        </div>

        <div style={{ color: '#8a7560', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          Navigate to DDC
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          <input
            type="text"
            placeholder="e.g. 500"
            maxLength={3}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') handleSearch();
            }}
            onKeyUp={(e) => e.stopPropagation()}
            onFocus={() => {
              if (isPointerLocked) setPointerLocked(false);
            }}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(240,217,181,0.25)',
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
              color: '#f0d9b5',
              padding: '6px 12px',
              fontFamily: "'Courier New', monospace",
              fontSize: '13px',
              width: '180px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              background: 'rgba(240,217,181,0.15)',
              border: '1px solid rgba(240,217,181,0.25)',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              color: '#d4b896',
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              fontSize: '13px',
            }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
