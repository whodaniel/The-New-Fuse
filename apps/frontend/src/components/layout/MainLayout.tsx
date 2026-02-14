import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { ShortcutsHelp } from './ShortcutsHelp';

export default function MainLayout() {
    const { layout } = useLayout();

    return (
        <div className="min-h-screen bg-background relative">
            <Header />
            <div className="flex h-[calc(100vh-4rem)]">
                <Sidebar className={layout.sidebarOpen ? 'w-64' : 'w-16'} />
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
            <Footer />
            <ShortcutsHelp />
        </div>
    );
}
