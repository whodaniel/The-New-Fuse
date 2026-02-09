import { useEffect } from 'react';

interface ShortcutDefinition {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutDefinition[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ 
  shortcuts,
  enabled = true 
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
        const altMatch = !!shortcut.altKey === event.altKey;
        
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault) {
          event.preventDefault();
        }
        matchingShortcut.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}