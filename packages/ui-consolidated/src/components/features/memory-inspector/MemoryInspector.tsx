import { MemoryItem } from '@the-new-fuse/api-types/src/memory';
import React from 'react';
import { useMemoryInspector } from '../../../hooks/useMemoryInspector';
import { Badge } from '../../Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { List, ListItem } from '../../List/List';
import { ScrollArea } from '../../ScrollArea/ScrollArea';

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
                <Badge variant={item.type === 'core' ? 'default' : 'secondary'}>{item.type}</Badge>
              </ListItem>
            ))}
          </List>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MemoryInspector;
