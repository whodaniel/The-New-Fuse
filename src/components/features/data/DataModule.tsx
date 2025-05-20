import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/core/CoreModule.js';
import { api } from '../lib/api.js';
import { useToast } from '../hooks/useToast.js';
import { TimeDelta } from '../config/timedelta.js';
const dataSourceSchema = z.object({
    import React, { FC } from 'react';
id: z.id(),
name: z.name(),
type: z.enum(['database', 'api', 'file', 'stream']),
;
config: z.record(z.any()),
;
status: z.enum(['connected', 'disconnected', 'error']),
;
lastSync: z.string().datetime(),
;
;
const dataModelSchema = z.object({
    import React, { FC } from 'react';
id: z.id(),
name: z.name(),
fields: z.array(z.object({
    import: React,
}, { FC }, from, 'react'));
name: z.name(),
type: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array']),
;
required: z.required(),
defaultValue: z.any().optional(),
;
validation: z.record(z.any()).optional(),
;
relations: z.array(z.object({
    import: React,
}, { FC }, from, 'react'));
name: z.name(),
type: z.enum(['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany']),
;
target: z.target(),
inverse: z.string().optional(),
;
indexes: z.array(z.object({
    import: React,
}, { FC }, from, 'react'));
name: z.name(),
fields: z.array(z.string()),
;
unique: z.unique(),
;
const querySchema = z.object({
    import React, { FC } from 'react';
id: z.id(),
name: z.name(),
type: z.enum(['select', 'insert', 'update', 'delete']),
;
model: z.model(),
fields: z.array(z.string()),
;
conditions: z.array(z.object({
    import: React,
}, { FC }, from, 'react'));
field: z.field(),
operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'like']),
;
value: z.value(),
sort: z.array(z.object({
    import: React,
}, { FC }, from, 'react'));
field: z.field(),
direction: z.enum(['asc', 'desc']),
;
limit: z.number().optional(),
;
offset: z.number().optional(),
;
;
as;
any;
infer;
as;
any;
infer;
as;
any;
infer;
sources: DataSource[];
onConnect: (source) => void ;
onDisconnect: (source) => void ;
onDelete: (source) => void ;
export const DataSourceManager = React.forwardRef();
({ sources, onConnect, onDisconnect, onDelete }, ref) => ;
JSX.Element;
{
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    const { toast } = useToast();
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    const [selectedSource, setSelectedSource] = React.useState(null);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    const handleConnect = async (): Promise<void> (source) => , JSX, Element, { import: React, }, { FC }, from;
    'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    try {
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        await api.post(`/data-sources/${source.id}/connect`);
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        onConnect(source);
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        toast.success(`Connected to ${source.name}`);
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
    }
    catch (error) {
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        toast.error(`Failed to connect to ${source.name}`);
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
    }
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
const handleDisconnect = async (): Promise<void> (source) => , JSX, Element, { import: React, }, { FC }, from;
'react';
try {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    await api.post(`/data-sources/${source.id}/disconnect`);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    onDisconnect(source);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.success(`Disconnected from ${source.name}`);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
catch (error) {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.error(`Failed to disconnect from ${source.name}`);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
const handleDelete = async (): Promise<void> (source) => , JSX, Element, { import: React, }, { FC }, from;
'react';
try {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    await api.delete(`/data-sources/${source.id}`);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    onDelete(source);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.success(`Deleted ${source.name}`);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
catch (error) {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.error(`Failed to delete ${source.name}`);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
return ();
<div ref={ref} className="space-y-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        {sources.map((source) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
          <Card key={source.id}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <CardHeader>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <div className="flex items-center justify-between">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <CardTitle>{source.name}</CardTitle>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  className={`w-3 h-3 rounded-full ${}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    (source as any).status === 'connected'
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      ? 'bg-green-500'
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      : (source as any).status === 'error'
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      ? 'bg-red-500'
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      : 'bg-yellow-500'
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  }`}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </CardHeader>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <CardContent>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <div className="space-y-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div className="grid grid-cols-2 gap-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <span className="text-sm font-medium">Type:</span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <span className="ml-2 text-sm">{source.type}</span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <span className="text-sm font-medium">Last Sync:</span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <span className="ml-2 text-sm">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      {new TimeDelta(new Date(source.lastSync)).toRelative()}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    </span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div className="flex space-x-2">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  {source.status === 'connected' ? ()
    :
}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <Button import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      onClick={(e) => e}: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>) => handleDisconnect(source)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      variant="outline"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      Disconnect
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    </Button>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  ) : (
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <Button onClick={(e) => e}/>: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>) => handleConnect(source)}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      Connect
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    </Button>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  )}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <Button import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    onClick={(e) => e}: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>e: React.MouseEvent) =>) => handleDelete(source)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    variant="destructive"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    Delete
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </Button>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </></div>;
div >
;
CardContent >
;
Card >
;
div >
;
;
;
DataSourceManager.displayName = 'DataSourceManager';
model: DataModel;
onChange: (model) => void ;
onSave: (model) => void ;
export const DataModelEditor = React.forwardRef();
({ model, onChange, onSave }, ref) => ;
JSX.Element;
{
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    const { register, handleSubmit, formState: { errors } } = useForm({
        import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    resolver: zodResolver(dataModelSchema),
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    defaultValues: model,
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
const { toast } = useToast();
const [isSaving, setIsSaving] = React.useState(false);
const handleSave = async (): Promise<void> (data) => , JSX, Element, { import: React, }, { FC }, from;
'react';
setIsSaving(true);
try {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    await api.put(`/data-models/${model.id}`, data);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    onSave(data);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.success('Model saved successfully');
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
catch (error) {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.error('Failed to save model');
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
finally {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    setIsSaving(false);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
return ();
<Card ref={ref}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        <CardHeader>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
          <CardTitle>Edit Data Model</CardTitle>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        </CardHeader>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        <CardContent>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <label className="block text-sm font-medium mb-1">Name</label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                {...register('name')}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {errors.name && ()}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <p className="mt-1 text-sm text-red-600">{errors.(name).message}</p>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              )}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <h3 className="text-sm font-medium mb-2">Fields</h3>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {model.fields.map((field, index) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div key={index} className="space-y-2 mb-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`fields.${index}.name`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    placeholder="Field name"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <select import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`fields.${index}.type`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="string">String</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="number">Number</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="boolean">Boolean</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="date">Date</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="object">Object</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="array">Array</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </select>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <label className="flex items-center">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      {...register(`fields.${index}.required`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      type="checkbox"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      className="rounded border-gray-300"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <span className="ml-2 text-sm">Required</span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              ))}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <h3 className="text-sm font-medium mb-2">Relations</h3>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {model.relations.map((relation, index) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div key={index} className="space-y-2 mb-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`relations.${index}.name`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    placeholder="Relation name"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <select import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`relations.${index}.type`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="oneToOne">One to One</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="oneToMany">One to Many</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="manyToOne">Many to One</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="manyToMany">Many to Many</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </select>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`relations.${index}.target`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    placeholder="Target model"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              ))}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <h3 className="text-sm font-medium mb-2">Indexes</h3>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {model.indexes.map((index, i) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div key={i} className="space-y-2 mb-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`indexes.${i}.name`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    placeholder="Index name"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <div className="flex items-center space-x-2">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      {...register(`indexes.${i}.fields`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      className="flex-1 rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      placeholder="Fields (comma-separated)"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <label className="flex items-center">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        {...register(`indexes.${i}.unique`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        type="checkbox"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        className="rounded border-gray-300"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      <span className="ml-2 text-sm">Unique</span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    </label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              ))}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <Button type="submit" disabled={isSaving}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {isSaving ? 'Saving...' : 'Save Model'}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </Button>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
          </form>;
CardContent >
;
Card >
;
;
;
DataModelEditor.displayName = 'DataModelEditor';
models: DataModel[];
onExecute: (query) => void ;
export const QueryBuilder = React.forwardRef();
({ models, onExecute }, ref) => ;
JSX.Element;
{
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    resolver: zodResolver(querySchema),
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
const { toast } = useToast();
const [isExecuting, setIsExecuting] = React.useState(false);
const selectedModel = watch('model');
const handleExecute = async (): Promise<void> (data) => , JSX, Element, { import: React, }, { FC }, from;
'react';
setIsExecuting(true);
try {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    const result = await api.post('/query/execute', data);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    onExecute(data);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.success('Query executed successfully');
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
catch (error) {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    toast.error('Failed to execute query');
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
finally {
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    setIsExecuting(false);
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
const model = models.find(m => m.id === selectedModel);
return ();
<Card ref={ref}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        <CardHeader>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
          <CardTitle>Query Builder</CardTitle>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        </CardHeader>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
        <CardContent>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
          <form onSubmit={handleSubmit(handleExecute)} className="space-y-6">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <label className="block text-sm font-medium mb-1">Query Type</label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <select import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                {...register('type')}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <option value="select">Select</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <option value="insert">Insert</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <option value="update">Update</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <option value="delete">Delete</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              </select>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <label className="block text-sm font-medium mb-1">Model</label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <select import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                {...register('model')}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                {models.map((model) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <option key={model.id} value={model.id}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {model.name}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                ))}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              </select>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            {model && ()}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <label className="block text-sm font-medium mb-1">Fields</label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div className="space-y-2">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  {model.fields.map((field) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <label key={field.name} className="flex items-center">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        type="checkbox"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        value={field.name}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        {...register('fields')}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        className="rounded border-gray-300"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      <span className="ml-2 text-sm">{field.name}</span>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    </label>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  ))}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              </div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            )}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';

import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            <div>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              <h3 className="text-sm font-medium mb-2">Conditions</h3>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {watch('conditions')?.map((_, index) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                <div key={index} className="space-y-2 mb-4">
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <select import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`conditions.${index}.field`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {model?.fields.map((field) => ())}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      <option key={field.name} value={field.name}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                        {field.name}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                      </option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    ))}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </select>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <select import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`conditions.${index}.operator`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  >
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="eq">Equals</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="ne">Not Equals</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="gt">Greater Than</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="lt">Less Than</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="gte">Greater Than or Equal</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="lte">Less Than or Equal</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="in">In</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="nin">Not In</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    <option value="like">Like</option>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  </select>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  <input import React/>, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    {...register(`conditions.${index}.value`)}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    className="w-full rounded-md border p-2"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                    placeholder="Value"
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                  />
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
                </div>;
div >
;
<Button type="submit" disabled={isExecuting}>
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
              {isExecuting ? 'Executing...' : 'Execute Query'}
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
import React, {FC} from 'react';
            </Button>;
form >
;
CardContent >
;
Card >
;
;
;
QueryBuilder.displayName = 'QueryBuilder';
{
    FC;
}
from;
'react';
DataSource,
;
DataModel,
;
Query,
;
DataSourceManagerProps,
;
DataModelEditorProps,
;
QueryBuilderProps,
;
;
