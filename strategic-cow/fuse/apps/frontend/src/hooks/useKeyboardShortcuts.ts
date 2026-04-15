import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Shortcut {
  key: string;
  description: string;
  action?: () => void;
  path?: string;
  category: 'Global' | 'Navigation' | 'Actions';
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: '?',
      description: 'Toggle keyboard shortcuts help',
      category: 'Global',
      action: () => setShowHelp((prev) => !prev),
    },
    {
      key: 'Escape',
      description: 'Close help or modals',
      category: 'Global',
      action: () => setShowHelp(false),
    },
    {
      key: 'Cmd+K',
      description: 'Open command palette',
      category: 'Global',
      action: () => document.dispatchEvent(new CustomEvent('cmd:palette')),
    },
    { key: 'Cmd+H', description: 'Go to Home', category: 'Navigation', path: '/' },
    { key: 'Cmd+W', description: 'Go to Workflows', category: 'Navigation', path: '/workflows' },
    {
      key: 'Cmd+Shift+C',
      description: 'Go to Command Center',
      category: 'Navigation',
      path: '/command-center',
    },
    { key: 'Cmd+,', description: 'Open Settings', category: 'Navigation', path: '/settings' },
    { key: 'Cmd+N', description: 'Create New Agent', category: 'Actions', path: '/agents/new' },
    {
      key: 'Cmd+S',
      description: 'Save current work',
      category: 'Actions',
      action: () => document.dispatchEvent(new CustomEvent('app:save')),
    },
    {
      key: 'Cmd+B',
      description: 'Toggle Sidebar',
      category: 'Global',
      action: () => document.dispatchEvent(new CustomEvent('sidebar:toggle')),
    },
    {
      key: 'Cmd+Shift+P',
      description: 'Toggle Performance Monitor',
      category: 'Global',
      action: () => document.dispatchEvent(new CustomEvent('perf:toggle')),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (event.key === 'Escape') {
          // Allow Escape to unfocus
          target.blur();
        } else {
          return;
        }
      }

      const isMod = event.metaKey || event.ctrlKey;
      const key = event.key;
      const isShift = event.shiftKey;

      // Never hijack native clipboard/select-all shortcuts.
      if (isMod && !isShift && ['c', 'x', 'v', 'a'].includes(key.toLowerCase())) {
        return;
      }

      const matchedShortcut = shortcuts.find((s) => {
        if (s.key === '?') return key === '?' || (key === '/' && isShift);
        if (s.key === 'Escape') return key === 'Escape';

        const parts = s.key.split('+');
        const hasShift = parts.includes('Shift');
        const hasMod = parts.includes('Cmd');
        const actualKey = parts[parts.length - 1];

        if (hasMod && hasShift) {
          return isMod && isShift && actualKey.toLowerCase() === key.toLowerCase();
        }
        if (hasMod) {
          return isMod && !isShift && actualKey.toLowerCase() === key.toLowerCase();
        }
        return key === s.key;
      });

      if (matchedShortcut) {
        event.preventDefault();
        if (matchedShortcut.action) {
          matchedShortcut.action();
        } else if (matchedShortcut.path) {
          navigate(matchedShortcut.path);
          setShowHelp(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, shortcuts]);

  return { showHelp, setShowHelp, shortcuts };
};
