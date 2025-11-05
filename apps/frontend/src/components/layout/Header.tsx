import React from 'react';
import { Link } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { Menu, Sun, Moon } from 'lucide-react';

export function Header() {
    const { toggleSidebar } = useLayout();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="bg-background border-b border-border h-16 flex items-center px-4 sticky top-0 z-10">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link to="/" className="ml-4 text-xl font-bold text-primary">
                        The New Fuse
                    </Link>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-6 w-6" />
                        ) : (
                            <Moon className="h-6 w-6" />
                        )}
                    </button>

                    {user ? (
                        <div className="flex items-center">
                            <span className="mr-2 text-sm text-muted-foreground">
                                {user.displayName || user.email}
                            </span>
                            <button
                                onClick={() => logout()}
                                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Link
                                to="/auth/login"
                                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Login
                            </Link>
                            <Link
                                to="/auth/register"
                                className="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/10"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
