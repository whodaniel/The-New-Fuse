import React, { useEffect } from 'react';
import { useA11y } from './A11yProvider.js';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifier?: 'ctrl' | 'shift' | 'alt';
}

export const KeyboardNavigation: React.FC = () => {
  const { screenReader } = useA11y();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: 'Focus search',
      action: () => document.querySelector<HTMLInputElement>('#search-input')?.focus(),
    },
    {
      key: 'Escape',
      description: 'Close modal or clear selection',
      action: () => document.dispatchEvent(new CustomEvent('app:escape')),
    },
    {
      key: 'j',
      description: 'Next item',
      action: () => document.dispatchEvent(new CustomEvent('navigation:next')),
    },
    {
      key: 'k',
      description: 'Previous item',
      action: () => document.dispatchEvent(new CustomEvent('navigation:previous')),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => s.key === event.key);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!screenReader) return null;

  return (
    <div className="keyboard-shortcuts" role="region" aria-label="Keyboard shortcuts">
      <ul>
        {shortcuts.map(({ key, description }) => (
          <li key={key}>
            <kbd>{key}</kbd>
            <span>{description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};