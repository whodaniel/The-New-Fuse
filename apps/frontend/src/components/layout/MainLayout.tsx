import { Outlet } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { Footer } from './Footer/index';
import { Header } from './Header/index';
import { ShortcutsHelp } from './ShortcutsHelp';
import { Sidebar } from './Sidebar/index';

export default function MainLayout() {
  const { layout } = useLayout();

  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar className={layout.sidebarOpen ? 'w-64' : 'w-16'} />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
      <Footer />
      <ShortcutsHelp />
    </div>
  );
}
