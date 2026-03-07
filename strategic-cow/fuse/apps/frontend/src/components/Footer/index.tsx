import { SettingsButton } from '@/components/SettingsButton';
import { IconButton } from '@/components/ui/premium/PremiumButton';
import System from '@/models/system';
import paths from '@/utils/paths';
import { Gear, Question, SignOut } from '@phosphor-icons/react';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [showTooltips, setShowTooltips] = useState(true);

  const handleSignOut = async () => {
    try {
      await System.signOut();
      window.location.href = paths.home();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <footer className={`flex items-center justify-between p-4 border-t ${className}`}>
      <div className="flex items-center space-x-4">
        <IconButton
          variant="ghost"
          icon={Question as any}
          onClick={() => setShowTooltips(!showTooltips)}
          data-tooltip-id="footer"
          data-tooltip-content={showTooltips ? 'Hide tooltips' : 'Show tooltips'}
        />

        <Link to={paths.settings()}>
          <IconButton
            variant="ghost"
            icon={Gear as any}
            data-tooltip-id="footer"
            data-tooltip-content="Settings"
          />
        </Link>

        <SettingsButton className="md:hidden" />
      </div>

      <div className="flex items-center space-x-4">
        <IconButton
          variant="ghost"
          icon={SignOut as any}
          onClick={handleSignOut}
          data-tooltip-id="footer"
          data-tooltip-content="Sign out"
        />
      </div>

      {showTooltips && !isMobile && (
        <Tooltip id="footer" place="top" effect="solid" className="z-50" />
      )}
    </footer>
  );
};
