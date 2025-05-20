Object.defineProperty(exports, "__esModule", { value: true });
exports.RootLayout = RootLayout;
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import theme_toggle_1 from '../common/theme-toggle.js';
import scroll_area_1 from '../ui/scroll-area.js';
import nav_menu_1 from './nav-menu.js';
import route_context_1 from '../../contexts/route-context.js';
function RootLayout() {
    const { pageTitle } = (0, route_context_1.useRoute)();
    return (<div className="flex h-screen bg-white dark:bg-neutral-950">
      
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Agent Factory</h2>
          <theme_toggle_1.ThemeToggle />
        </div>
        <scroll_area_1.ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4">
            <nav_menu_1.NavMenu />
          </div>
        </scroll_area_1.ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-8 flex items-center">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {pageTitle}
          </h1>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <react_router_dom_1.Outlet />
        </div>
      </main>
    </div>);
}
export {};
//# sourceMappingURL=root-layout.js.map