import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useLayout } from '../../../contexts/LayoutContext.js';
import {
    Home,
    LayoutDashboard,
    Settings,
    Users,
    Bot,
    BarChart,
    Menu,
    GitBranch,
    Lightbulb
} from 'lucide-react';

interface SidebarProps {
    className?: string;
}

const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Portal', href: '/ai-portal', icon: Bot },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
    { name: 'Suggestions', href: '/suggestions', icon: Lightbulb },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className = '' }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { layout, toggleSidebar } = useLayout();

    return (
        <div className={`border-r bg-card flex flex-col ${className}`}>
            <div className="p-4 border-b">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="mb-2"
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>
            <nav className="flex-1">
                <div className="px-2 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Button
                                key={item.name}
                                variant={isActive ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => navigate(item.href)}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {layout.sidebarOpen && <span>{item.name}</span>}
                            </Button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}