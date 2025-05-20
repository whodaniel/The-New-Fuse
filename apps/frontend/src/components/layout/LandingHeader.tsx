import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const LandingHeader = () => {
  return (
    <header className="bg-background shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          The New Fuse
        </Link>
        <div className="space-x-2">
          <Button asChild variant="ghost">
            <Link to="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/register">Sign Up</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};