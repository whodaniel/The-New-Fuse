import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { Tooltip } from 'react-tooltip';
import {
  ChatCircle,
  Cpu,
  Database,
  Gear,
  Globe,
  Info,
  Key,
  Lock,
  MagnifyingGlass,
  Plus,
  Question,
  SignOut,
  User,
} from '@phosphor-icons/react';
import System from '@/models/system';
import paths from '@/utils/paths';
import { SettingsButton } from '@/components/SettingsButton';
import { Button } from '@/components/ui/button';

interface FooterProps {
  className?: string;
}

export const Footer: React.React.FC<FooterProps> = ({ className = '' }) => {
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTooltips(!showTooltips)}
          data-tooltip-id="footer"
          data-tooltip-content={showTooltips ? 'Hide tooltips' : 'Show tooltips'}
        >
          <Question className="h-5 w-5" />
        </Button>

        <Link to={paths.settings()}>
          <Button
            variant="ghost"
            size="icon"
            data-tooltip-id="footer"
            data-tooltip-content="Settings"
          >
            <Gear className="h-5 w-5" />
          </Button>
        </Link>

        <SettingsButton className="md:hidden" />
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          data-tooltip-id="footer"
          data-tooltip-content="Sign out"
        >
          <SignOut className="h-5 w-5" />
        </Button>
      </div>

      {showTooltips && !isMobile && (
        <Tooltip
          id="footer"
          place="top"
          effect="solid"
          className="z-50"
        />
      )}
    </footer>
  );
};
