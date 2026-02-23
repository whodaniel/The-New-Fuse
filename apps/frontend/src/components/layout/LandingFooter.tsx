import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-12" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">The New Fuse</h3>
            <p className="text-sm">
              AI Collaboration Platform for next-generation workflow automation and agent orchestration.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <nav aria-label="Product links">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/integrations" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Integrations
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <nav aria-label="Resource links">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/docs" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Support
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <nav aria-label="Legal links">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/legal/privacy" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/legal/terms" className="hover:text-foreground transition-colors focus:outline-none focus:underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-muted-foreground/20 pt-6 text-center text-sm">
          <p>&copy; {currentYear} The New Fuse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};