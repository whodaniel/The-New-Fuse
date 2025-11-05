import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
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
        className={`transition-all duration-300 ${className}`}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </Link>
  );
};

export default SettingsButton;
