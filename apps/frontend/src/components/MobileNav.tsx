import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface NavLink {
  label: string;
  href: string;
}

interface MobileNavProps {
  links?: NavLink[];
  logo?: string;
  brandName?: string;
}

export default function MobileNav({
  links = [
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ],
  logo = '/logo.svg',
  brandName = 'The New Fuse'
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 z-50"
            onClick={closeMenu}
          >
            <span className="text-xl md:text-2xl font-bold text-foreground">
              {brandName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="inline-flex items-center justify-center min-h-touch min-w-[120px] rounded-md px-6 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden relative z-50 min-h-touch min-w-touch flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-foreground transform transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-foreground transition-all duration-300 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-foreground transform transition-all duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background/95 backdrop-blur-lg transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{ top: '64px' }}
      >
        <div
          className={`flex flex-col items-center justify-center h-full space-y-8 px-4 transition-all duration-300 ${
            isOpen ? 'animate-fade-in' : ''
          }`}
        >
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={`text-2xl font-medium text-foreground hover:text-primary transition-colors duration-200 ${
                isOpen ? 'animate-slide-in-up' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={closeMenu}
            className={`inline-flex items-center justify-center min-h-touch w-full max-w-xs rounded-md px-6 py-3 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ${
              isOpen ? 'animate-scale-in' : ''
            }`}
            style={{ animationDelay: `${links.length * 0.1}s` }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
