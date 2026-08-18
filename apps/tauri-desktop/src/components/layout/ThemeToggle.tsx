import { Moon, Sun } from 'lucide-react';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';

interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string;
}

/**
 * Compact theme control for the desktop shell.
 * Cycles light ↔ dark (persisted via ThemeProvider). System mode stays in Settings.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed = false, className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const next = resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${collapsed ? 'collapsed' : ''} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {resolvedTheme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      {!collapsed ? <span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span> : null}
    </button>
  );
};

export default ThemeToggle;
