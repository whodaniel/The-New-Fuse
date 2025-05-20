import React, { FC } from "react";
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar/index.js';

// Create a simplified Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'primary';
  children?: React.ReactNode;
}

const Button: FC<ButtonProps> = ({ 
  variant = 'default', 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`button button-${variant} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

interface MainLayoutProps {
  // Add any props here if needed
}

const MainLayout: FC<MainLayoutProps> = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Workspace', path: '/workspace' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Settings', path: '/settings' },
    { name: 'Fine Tuning', path: '/fine-tuning' },
    { name: 'Invite', path: '/invite' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar className="flex-shrink-0" />

      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-card shadow-md p-4 border-b">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-primary">The New Fuse</Link>

            <div className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    location.pathname === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => console.log('Profile clicked')}>Profile</Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 container mx-auto p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;