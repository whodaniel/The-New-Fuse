import React, { FC } from 'react';
import { z } from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/core/CoreModule.js';
import { LRUCache } from '../config/lru_cache.js';
import { formatJSON } from '../config/json_formatter.js';

// Schema definitions
const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  type: z.enum(['header', 'query']),
  prefix: z.string().optional(),
  expiration: z.string().datetime().optional(),
});

const webhookSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
  active: z.boolean(),
  retries: z.number(),
  created_at: z.string().datetime(),
});

// Types
type APIKey = z.infer<typeof apiKeySchema>;
type Webhook = z.infer<typeof webhookSchema>;

// Cache configuration
const responseCache = new LRUCache<string, any>({
  maxSize: 100,
  ttl: 5 * 60 * 1000 // 5 minutes
});

// Method Badge Component
interface MethodBadgeProps {
  method: Endpoint['method'];
}

const MethodBadge: FC<MethodBadgeProps> = ({ method }) => {
  const colors = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500'
  };

  return (
    <Badge className={`${colors[method]} text-white`}>
      {method}
    </Badge>
  );
};

// API Documentation Component
interface APIDocumentationProps {
  endpoints: Endpoint[];
  onTryEndpoint?: (endpoint: Endpoint) => void;
}

export const APIDocumentation = React.forwardRef<HTMLDivElement, APIDocumentationProps>(
  ({ endpoints, onTryEndpoint }, ref) => {
    const [selectedEndpoint, setSelectedEndpoint] = React.useState<Endpoint | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredEndpoints = React.useMemo(
      () =>
        endpoints.filter(endpoint =>
          endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      [endpoints, searchQuery]
    );

    return (
      <div ref={ref} className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-4">
          <Input
            type="search"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {filteredEndpoints.map(endpoint => (
            <Card
              key={endpoint.id}
              className={`cursor-pointer ${selectedEndpoint?.id === endpoint.id ? 'border-primary' : ''}`}
              onClick={() => setSelectedEndpoint(endpoint)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{endpoint.name}</span>
                  <MethodBadge method={endpoint.method} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{endpoint.path}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="col-span-3">
          {selectedEndpoint ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedEndpoint.name}
                  <MethodBadge method={selectedEndpoint.method} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Description</h3>
                    <p className="mt-2 text-muted-foreground">
                      {selectedEndpoint.description}
                    </p>
                  </div>

                  {selectedEndpoint.parameters.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium">Parameters</h3>
                      <div className="mt-2 space-y-4">
                        {selectedEndpoint.parameters.map(param => (
                          <div key={param.name}>
                            <div className="flex items-center">
                              <span className="font-medium">{param.name}</span>
                              {param.required && (
                                <Badge className="ml-2">Required</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {param.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium">Responses</h3>
                    <div className="mt-2 space-y-4">
                      {Object.entries(selectedEndpoint.responses).map(([status, response]) => (
                        <div key={status}>
                          <div className="flex items-center">
                            <span className="font-medium">Status {status}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {response.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {onTryEndpoint && (
                    <Button
                      onClick={() => onTryEndpoint(selectedEndpoint)}
                      className="mt-4"
                    >
                      Try it out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an endpoint to view its documentation
            </div>
          )}
        </div>
      </div>
    );
  }
);

APIDocumentation.displayName = 'APIDocumentation';

interface APIKeyManagerProps {
  keys: APIKey[];
  onGenerate: (data: Omit<APIKey, 'id' | 'key'>) => Promise<void>;
  onRevoke: (key: APIKey) => Promise<void>;
}

export const APIKeyManager = (React as any).forwardRef<HTMLDivElement, APIKeyManagerProps>(
  ({ keys, onGenerate, onRevoke }, ref) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
      resolver: zodResolver(apiKeySchema.omit({ id: true, key: true })),
    });

    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleGenerate = async (data: Omit<APIKey, 'id' | 'key'>) => {
      setIsGenerating(true);
      try {
        await onGenerate(data);
        reset();
        toast({
          title: 'Success',
          description: 'API key generated successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate API key',
          variant: 'destructive',
        });
        console.error('Failed to generate API key:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    const handleRevoke = async (key: APIKey) => {
      try {
        await onRevoke(key);
        toast({
          title: 'Success',
          description: 'API key revoked successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to revoke API key',
          variant: 'destructive',
        });
        console.error('Failed to revoke API key:', error);
      }
    };

    return (
      <div ref={ref}>
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4">
              <div>
                <Input {...register('name')} placeholder="Key name" />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message as string}</p>
                )}
              </div>
              <div>
                <Select {...register('type')}>
                  <option value="header">Header</option>
                  <option value="query">Query</option>
                </Select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-500">{errors.type.message as string}</p>
                )}
              </div>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Key'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {keys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {key.type === 'header' ? 'Header' : 'Query'} Key
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => onRevoke(key)}
                      size="sm"
                    >
                      Revoke
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

APIKeyManager.displayName = 'APIKeyManager';

interface WebhookManagerProps {
  webhooks: Webhook[];
  onAdd: (data: Omit<Webhook, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (webhook: Webhook) => Promise<void>;
  onDelete: (webhook: Webhook) => Promise<void>;
}

export const WebhookManager = React.forwardRef<HTMLDivElement, WebhookManagerProps>(
  ({ webhooks, onAdd, onUpdate, onDelete }, ref) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
      resolver: zodResolver(webhookSchema.omit({ id: true, created_at: true })),
    });

    const { toast } = useToast();
    const [isAdding, setIsAdding] = React.useState(false);

    const handleAdd = async (data: Omit<Webhook, 'id' | 'created_at'>) => {
      setIsAdding(true);
      try {
        await onAdd(data);
        reset();
        toast({
          title: 'Success',
          description: 'Webhook added successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add webhook',
          variant: 'destructive',
        });
        console.error('Failed to add webhook:', error);
      } finally {
        setIsAdding(false);
      }
    };

    return (
      <div ref={ref}>
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
              <div>
                <Input {...register('name')} placeholder="Webhook name" />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message as string}</p>
                )}
              </div>
              <div>
                <Input {...register('url')} placeholder="Webhook URL" />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-500">{errors.url.message as string}</p>
                )}
              </div>
              <div>
                <Input {...register('events')} placeholder="Events (comma-separated)" />
                {errors.events && (
                  <p className="mt-1 text-sm text-red-500">{errors.events.message as string}</p>
                )}
              </div>
              <Button type="submit" disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add Webhook'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{webhook.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {webhook.url}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(webhook)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(webhook)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

WebhookManager.displayName = 'WebhookManager';

class APIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-600">Something went wrong</h3>
          <p className="mt-2 text-muted-foreground">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export type {
  Endpoint,
  APIKey,
  Webhook,
  APIDocumentationProps,
  APIKeyManagerProps,
  WebhookManagerProps,
};