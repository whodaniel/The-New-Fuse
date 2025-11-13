import React from 'react';
import { useMemoryInspector } from '../../../hooks/useMemoryInspector';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { List, ListItem } from '../../List/List';
import { ScrollArea } from '../../ScrollArea/ScrollArea';
import { Badge } from '../../Badge/Badge';
const MemoryInspector = ({ agentId }) => {
    const { items, loading, error } = useMemoryInspector(agentId);
    if (loading)
        return <div>Loading memory...</div>;
    if (error)
        return <div>Error: {error}</div>;
    return (<Card>
      <CardHeader>
        <CardTitle>Memory Inspector</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <List>
            {items.map((item) => (<ListItem key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.content}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant={item.type === 'core' ? 'default' : 'secondary'}>
                  {item.type}
                </Badge>
              </ListItem>))}
          </List>
        </ScrollArea>
      </CardContent>
    </Card>);
};
export default MemoryInspector;
//# sourceMappingURL=MemoryInspector.js.map