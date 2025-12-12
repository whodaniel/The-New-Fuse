import React from 'react';
import { LifeSaverTokenContainer } from './ui/LifeSaverToken';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const handleTokenTransfer = (index: number) => {
    console.log(`Token ${index} transferred`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen pb-16">{children}</main>
      <LifeSaverTokenContainer tokens={5} onTransfer={handleTokenTransfer} />
    </div>
  );
}

// Standard layout without the token container
export function StandardLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
