import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

interface GenericSkillPanelProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const GenericSkillPanel: React.FC<GenericSkillPanelProps> = ({ title, description, children }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children || <div className="text-muted-foreground">Configure this skill...</div>}
      </CardContent>
    </Card>
  );
};

export default GenericSkillPanel;
