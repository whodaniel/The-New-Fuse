import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeToggle } from './theme-toggle';
import { ScrollArea } from './ui/scroll-area';
import { NavMenu } from './nav-menu';
import { useRoute } from './route-context';

export function RootLayout() {
  const { pageTitle } = useRoute();

  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950">
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Agent Factory</h2>
          <ThemeToggle />
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4">
            <NavMenu />
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-8 flex items-center">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {pageTitle}
          </h1>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
