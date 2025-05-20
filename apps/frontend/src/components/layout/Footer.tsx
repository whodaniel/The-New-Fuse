import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="bg-background border-t border-border py-4 px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} The New Fuse. All rights reserved.
                    </p>
                </div>
                <div className="flex space-x-4">
                    <Link to="/legal/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                        Privacy Policy
                    </Link>
                    <Link to="/legal/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}
