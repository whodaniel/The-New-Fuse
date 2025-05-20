import React, { ReactNode } from 'react';
import { cn } from './utils.js';

export interface LayoutProps {
  children: ReactNode;
  sidebar?: boolean;
  header?: boolean;
  footer?: boolean;
  className?: string;
  navigation?: Array<{
    id: string;
    label: string;
    path: string;
    icon?: ReactNode;
    children?: Array<{
      id: string;
      label: string;
      path: string;
    }>;
  }>;
  currentPath?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  footerLinks?: Array<{
    label: string;
    href: string;
  }>;
}

/**
 * Layout component that provides a consistent page structure with optional header, sidebar, and footer
 *
 * @example
 * // Basic usage
 * <Layout>
 *   <p>Content goes here</p>
 * </Layout>
 *
 * // With all options
 * <Layout
 *   sidebar={true}
 *   header={true}
 *   footer={true}
 *   navigation={navigationItems}
 *   currentPath="/dashboard"
 *   user={currentUser}
 *   onNavigate={handleNavigate}
 *   onLogout={handleLogout}
 *   footerLinks={footerLinks}
 * >
 *   <p>Content goes here</p>
 * </Layout>
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar = true,
  header = true,
  footer = true,
  className,
  navigation = [],
  currentPath = '',
  user,
  onNavigate,
  onLogout,
  onProfile,
  onSettings,
  footerLinks = []
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={cn("min-h-screen bg-gray-100 dark:bg-gray-900", className)}>
      {header && (
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center px-4">
          <button
            onClick={toggleSidebar}
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-semibold">The New Fuse</h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <button
                onClick={onProfile}
                className="flex items-center space-x-2 text-sm"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span>{user.name}</span>
              </button>

              <button
                onClick={onSettings}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                aria-label="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebar && (
          <aside
            className={`bg-white dark:bg-gray-800 w-64 transition-all duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed inset-y-0 z-10 mt-16 lg:static lg:translate-x-0`}
          >
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => onNavigate?.(item.path)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                      currentPath === item.path
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon && <span className="mr-3">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>

                  {item.children && item.children.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => onNavigate?.(child.path)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                            currentPath === child.path
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>
        )}

        <main className={`flex-1 overflow-auto p-6 transition-all duration-300 ${
          sidebar && sidebarOpen ? 'lg:ml-64' : ''
        }`}>
          {children}
        </main>
      </div>

      {footer && (
        <footer className="bg-white dark:bg-gray-800 shadow-sm p-4 text-center">
          <div className="flex justify-center space-x-4">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} The New Fuse. All rights reserved.
          </p>
        </footer>
      )}
    </div>
  );
};
