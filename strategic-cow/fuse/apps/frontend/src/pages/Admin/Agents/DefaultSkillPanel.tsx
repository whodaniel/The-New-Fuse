import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import React from 'react';

interface DefaultSkillPanelProps {
  title: string;
  description?: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

const DefaultSkillPanel: React.FC<DefaultSkillPanelProps> = ({
  title,
  description,
  enabled = false,
  onToggle,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="text-sm">{description}</CardDescription>}
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {enabled ? 'This skill is enabled for the agent.' : 'This skill is disabled.'}
        </div>
      </CardContent>
    </Card>
  );
};

export default DefaultSkillPanel;
