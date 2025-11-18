import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const LandingHeader = () => {
  return (
    <header className="bg-background shadow-sm sticky top-0 z-50" role="banner">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center" role="navigation" aria-label="Main navigation">
        <Link
          to="/"
          className="text-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/20 rounded-md px-2 py-1"
          aria-label="The New Fuse - Home"
        >
          The New Fuse
        </Link>
        <div className="space-x-2" role="group" aria-label="Account actions">
          <Button
            asChild
            variant="ghost"
            className="focus:ring-4 focus:ring-primary/20"
            aria-label="Log in to your account"
          >
            <Link to="/auth/login">Login</Link>
          </Button>
          <Button
            asChild
            className="focus:ring-4 focus:ring-primary/20"
            aria-label="Sign up for a new account"
          >
            <Link to="/auth/register">Sign Up</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};