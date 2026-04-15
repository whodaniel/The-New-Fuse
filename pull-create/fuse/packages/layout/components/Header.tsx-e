import React, { FC } from "react";
import { useLayout } from '@the-new-fuse/LayoutContext';

export interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
  };
}

export const Header: FC<HeaderProps> = ({ title, actions, user }) => {
  const { theme, setTheme } = useLayout();

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-white shadow-sm">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light'): bg-gray-100"
        > {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        {actions}
        
        {user && (
          <div className="flex items-center space-x-2">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {user.name[0]}
              </div>
            )}
            <span>{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};