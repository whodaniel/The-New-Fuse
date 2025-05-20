import React from 'react';
import { useMemoryInspector, MemoryItem } from '../hooks/useMemoryInspector.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../../core/card/index.js';
import { List, ListItem } from '../../../core/list/index.js';
import { ScrollArea } from '../../../core/scroll-area.js';
import { Badge } from '../../../core/badge.js';

interface MemoryInspectorProps {
  agentId: string;
}

const MemoryInspector: React.FC<MemoryInspectorProps> = ({ agentId }) => {
  const { items, loading, error } = useMemoryInspector(agentId);

  if (loading) return <div>Loading memory...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory Inspector</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <List>
            {items.map((item: MemoryItem) => (
              <ListItem key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.content}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant={item.type === 'core' ? 'default' : 'secondary'}>
                  {item.type}
                </Badge>
              </ListItem>
            ))}
          </List>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MemoryInspector;