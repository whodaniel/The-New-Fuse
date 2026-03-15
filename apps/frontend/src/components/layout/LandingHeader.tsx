import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { Link } from 'react-router-dom';

export const LandingHeader = () => {
  return (
    <header className="bg-background shadow-none sticky top-0 z-50" role="banner">
      <nav
        className="container mx-auto px-4 py-2 flex justify-between items-center"
        role="navigation"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="text-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/20 rounded-md px-2 py-1"
          aria-label="The New Fuse - Home"
        >
          The New Fuse
        </Link>
        <div className="space-x-2" role="group" aria-label="Account actions">
          <Link to="/auth/login">
            <Button
              variant="ghost"
              className="focus:ring-4 focus:ring-primary/20"
              aria-label="Log in to your account"
            >
              Login
            </Button>
          </Link>
          <Link to="/auth/register">
            <Button
              className="focus:ring-4 focus:ring-primary/20"
              aria-label="Sign up for a new account"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};
