import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DESKTOP_ROUTES } from '../../config/routes';
import { WEB_SURFACES, resolveWebAppBaseUrl, webSurfaceUrl } from '../../config/webSurfaces';
import { openExternal } from '../../lib/openExternal';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRoute } from '../route-context';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { navigate } = useRoute();
  const { environment } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const webBase = resolveWebAppBaseUrl(environment);

  const items = useMemo<PaletteItem[]>(() => {
    const native: PaletteItem[] = DESKTOP_ROUTES.map((route) => ({
      id: `native-${route.path}`,
      label: route.label,
      hint: route.path,
      action: () => {
        navigate(route.path);
        onClose();
      },
    }));

    const web: PaletteItem[] = WEB_SURFACES.filter((surface) => !surface.nativeRoute).map(
      (surface) => ({
        id: `web-${surface.id}`,
        label: `${surface.name} (web)`,
        hint: surface.path,
        action: () => {
          void openExternal(webSurfaceUrl(webBase, surface.path));
          onClose();
        },
      })
    );

    return [...native, ...web];
  }, [navigate, onClose, webBase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 24);
    return items
      .filter((item) => {
        const haystack = `${item.label} ${item.hint ?? ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 24);
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, Math.max(filtered.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === 'Enter' && filtered[activeIndex]) {
        event.preventDefault();
        filtered[activeIndex].action();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, activeIndex, onClose]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" role="presentation" onClick={onClose}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="command-palette-input"
          placeholder="Jump to a page or open on web…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search routes"
        />
        <ul className="command-palette-list" role="listbox">
          {filtered.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`command-palette-item ${index === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => item.action()}
              >
                <span>{item.label}</span>
                {item.hint ? <span className="command-palette-hint">{item.hint}</span> : null}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="command-palette-empty">No matches for “{query}”</li>
          ) : null}
        </ul>
      </div>
      <style>{`
        .command-palette-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 12vh 16px 16px;
        }
        .command-palette {
          width: min(560px, 100%);
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid var(--tnf-border);
          border-radius: 14px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        .command-palette-input {
          width: 100%;
          padding: 16px 18px;
          border: none;
          border-bottom: 1px solid var(--tnf-border);
          background: transparent;
          color: var(--tnf-text-primary);
          font-size: 15px;
        }
        .command-palette-input:focus {
          outline: none;
        }
        .command-palette-list {
          list-style: none;
          margin: 0;
          padding: 8px;
          max-height: 360px;
          overflow-y: auto;
        }
        .command-palette-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--tnf-text-primary);
          cursor: pointer;
          text-align: left;
          font-size: 14px;
        }
        .command-palette-item.active,
        .command-palette-item:hover {
          background: rgba(99, 102, 241, 0.16);
        }
        .command-palette-hint {
          font-size: 12px;
          color: var(--tnf-text-muted);
          font-family: var(--tnf-font-mono, monospace);
        }
        .command-palette-empty {
          padding: 16px;
          color: var(--tnf-text-muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export function useCommandPaletteShortcut(onToggle: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? event.metaKey : event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToggle]);
}

export default CommandPalette;
