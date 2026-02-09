import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface SQLConnectorSelectionProps {
  onSelect?: (provider: string) => void;
}

const AgentSQLConnectorSelection: React.FC<SQLConnectorSelectionProps> = ({ onSelect }) => {
  const sqlProviders = [
    { id: 'postgresql', name: 'PostgreSQL', description: 'Connect to PostgreSQL databases' },
    { id: 'mysql', name: 'MySQL', description: 'Connect to MySQL databases' },
    { id: 'mssql', name: 'SQL Server', description: 'Connect to Microsoft SQL Server' },
    { id: 'sqlite', name: 'SQLite', description: 'Connect to SQLite databases' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sqlProviders.map((provider) => (
          <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm">{provider.name}</CardTitle>
              <CardDescription className="text-xs">{provider.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="sm" 
                onClick={() => onSelect?.(provider.id)}
                className="w-full"
              >
                Select {provider.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgentSQLConnectorSelection;