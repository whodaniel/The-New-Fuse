import React from 'react';
import { Link } from 'react-router-dom';
import { Gear } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import useUser from '@/hooks/useUser';
import paths from '@/utils/paths';

interface SettingsButtonProps {
  className?: string;
}

export const SettingsButton: React.React.FC<SettingsButtonProps> = ({ className }) => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Link to={paths.settings()}>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Settings"
      >
        <Gear className="h-5 w-5" />
      </Button>
    </Link>
  );
};
