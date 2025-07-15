import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface WebSearchSelectionProps {
  onSelect?: (provider: string) => void;
}

const AgentWebSearchSelection: React.FC<WebSearchSelectionProps> = ({ onSelect }) => {
  const searchProviders = [
    { id: 'google', name: 'Google Search', description: 'Google web search API' },
    { id: 'bing', name: 'Bing Search', description: 'Microsoft Bing search API' },
    { id: 'duckduckgo', name: 'DuckDuckGo', description: 'Privacy-focused search' },
    { id: 'tavily', name: 'Tavily', description: 'AI-powered search for agents' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {searchProviders.map((provider) => (
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

export default AgentWebSearchSelection;