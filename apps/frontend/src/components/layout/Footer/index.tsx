import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="border-t bg-card py-4 px-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} The New Fuse. All rights reserved.
                </p>
                <nav className="flex space-x-4">
                    <Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                        Privacy Policy
                    </Link>
                    <Link to="/legal/terms" className="text-sm text-muted-foreground hover:text-foreground">
                        Terms of Service
                    </Link>
                </nav>
            </div>
        </footer>
    );
}