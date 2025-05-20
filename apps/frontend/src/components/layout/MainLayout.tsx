import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext.js';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { Footer } from './Footer.js';

export default function MainLayout() {
    const { layout } = useLayout();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex h-[calc(100vh-4rem)]">
                <Sidebar className={layout.sidebarOpen ? 'w-64' : 'w-16'} />
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
            <Footer />
        </div>
    );
}