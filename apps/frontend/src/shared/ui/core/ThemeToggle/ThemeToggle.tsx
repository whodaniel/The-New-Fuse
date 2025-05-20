import React from 'react';
import { Button } from '../Button.js';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { MoonIcon, SunIcon } from '@/components/icons';
export function ThemeToggle({ className, iconClassName, showLabel = false }) {
    const { theme, toggleTheme } = useTheme();
    const isLight = theme === 'light';
    return (<Button variant="ghost" size="icon" onClick={toggleTheme} className={cn('relative w-9 h-9', className)} aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}>
      <div className="relative w-5 h-5">
        <div className={cn('absolute inset-0 transition-opacity', isLight ? 'opacity-0' : 'opacity-100', iconClassName)}>
          <MoonIcon className="w-full h-full"/>
        </div>
        <div className={cn('absolute inset-0 transition-opacity', isLight ? 'opacity-100' : 'opacity-0', iconClassName)}>
          <SunIcon className="w-full h-full"/>
        </div>
      </div>
      {showLabel && (<span className="ml-2 text-sm">
          {isLight ? 'Dark Mode' : 'Light Mode'}
        </span>)}
    </Button>);
}
//# sourceMappingURL=ThemeToggle.js.map