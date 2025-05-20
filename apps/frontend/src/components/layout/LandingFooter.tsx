import React from 'react';

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted text-muted-foreground py-4 mt-12">
      <div className="container mx-auto px-4 text-center text-sm">
        &copy; {currentYear} The New Fuse. All rights reserved.
      </div>
    </footer>
  );
};