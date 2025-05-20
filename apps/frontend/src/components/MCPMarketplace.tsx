import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MCPMarketplaceService, MCPMarketplaceServer } from '../services/MCPMarketplaceService.js';
import { useMcpServers } from '../hooks/useMcp.js';
import { StarRating } from '@/components/ui/star-rating';
import { Icons } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

/**
 * MCP Marketplace component for browsing and installing MCP servers
 */
export function MCPMarketplace() {
  const [servers, setServers] = useState<MCPMarketplaceServer[]>([]);
  const [filteredServers, setFilteredServers] = useState<MCPMarketplaceServer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedServer, setSelectedServer] = useState<MCPMarketplaceServer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  
  const marketplaceService = new MCPMarketplaceService();
  const { createServer, servers: installedServers } = useMcpServers();
  
  // Load servers on mount
  useEffect(() => {
    fetchServers();
  }, []);
  
  // Filter servers when search query or category changes
  useEffect(() => {
    if (!servers.length) return;
    
    let filtered = [...servers];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(server => server.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(server => 
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query) ||
        server.publisher.toLowerCase().includes(query) ||
        server.capabilities.some(cap => cap.toLowerCase().includes(query))
      );
    }
    
    setFilteredServers(filtered);
  }, [servers, searchQuery, selectedCategory]);
  
  /**
   * Fetch all servers from the marketplace
   */
  const fetchServers = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getServers();
      setServers(data);
      setFilteredServers(data);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(server => server.category)));
      setCategories(uniqueCategories);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching MCP marketplace servers:', error);
      setLoading(false);
    }
  };
  
  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * Handle category selection change
   */
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };
  
  /**
   * Show server details dialog
   */
  const showServerDetails = (server: MCPMarketplaceServer) => {
    setSelectedServer(server);
    setDialogOpen(true);
  };
  
  /**
   * Show installation dialog
   */
  const showInstallDialog = (server: MCPMarketplaceServer) => {
    setSelectedServer(server);
    setInstallDialogOpen(true);
  };
  
  /**
   * Check if server is already installed
   */
  const isServerInstalled = (serverId: string) => {
    return installedServers.some(server => server.id === serverId);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">MCP Server Marketplace</h1>
        <Button variant="outline" onClick={fetchServers} disabled={loading}>
          {loading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.refresh className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search servers..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="browse" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No servers found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map(server => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onViewDetails={() => showServerDetails(server)}
                  onInstall={() => showInstallDialog(server)}
                  isInstalled={isServerInstalled(server.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers
                .sort((a, b) => b.downloads - a.downloads)
                .slice(0, 6)
                .map(server => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onViewDetails={() => showServerDetails(server)}
                    onInstall={() => showInstallDialog(server)}
                    isInstalled={isServerInstalled(server.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers
                .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                .slice(0, 6)
                .map(server => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onViewDetails={() => showServerDetails(server)}
                    onInstall={() => showInstallDialog(server)}
                    isInstalled={isServerInstalled(server.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {selectedServer && (
        <ServerDetailsDialog
          server={selectedServer}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onInstall={() => {
            setDialogOpen(false);
            showInstallDialog(selectedServer);
          }}
          isInstalled={isServerInstalled(selectedServer.id)}
        />
      )}
      
      {selectedServer && (
        <ServerInstallDialog
          server={selectedServer}
          open={installDialogOpen}
          onClose={() => setInstallDialogOpen(false)}
          onInstall={(config) => handleInstallServer(selectedServer, config)}
        />
      )}
    </div>
  );
  
  /**
   * Handle server installation
   */
  async function handleInstallServer(server: MCPMarketplaceServer, config?: Record<string, any>) {
    try {
      const success = await marketplaceService.installServer(server.id, config);
      
      if (success) {
        // Add server to the list of installed servers
        await createServer({
          name: server.name,
          description: server.description,
          command: server.installCommand,
          args: server.args,
          env: config || {}
        });
        
        toast({
          title: "Server Installed",
          description: `${server.name} has been installed successfully`,
          variant: "default",
        });
        
        setInstallDialogOpen(false);
      } else {
        toast({
          title: "Installation Failed",
          description: "There was an error installing the server",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Installation Failed",
        description: error.message || "There was an error installing the server",
        variant: "destructive",
      });
    }
  }
}

/**
 * Server card component
 */
function ServerCard({ 
  server, 
  onViewDetails, 
  onInstall,
  isInstalled
}: { 
  server: MCPMarketplaceServer; 
  onViewDetails: () => void;
  onInstall: () => void;
  isInstalled: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{server.name}</CardTitle>
          <Badge variant="outline">{server.category}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span>{server.publisher}</span>
          <span className="text-sm text-muted-foreground">v{server.version}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground mb-3">{server.description}</p>
        <div className="flex items-center justify-between">
          <StarRating rating={server.rating} />
          <span className="text-sm text-muted-foreground">{server.downloads.toLocaleString()} downloads</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {server.capabilities.slice(0, 3).map(capability => (
            <Badge key={capability} variant="secondary" className="text-xs">
              {capability}
            </Badge>
          ))}
          {server.capabilities.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{server.capabilities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </Button>
        <Button 
          variant={isInstalled ? "secondary" : "default"} 
          size="sm" 
          onClick={onInstall}
          disabled={isInstalled}
        >
          {isInstalled ? "Installed" : "Install"}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Server details dialog component
 */
function ServerDetailsDialog({ 
  server, 
  open, 
  onClose,
  onInstall,
  isInstalled
}: { 
  server: MCPMarketplaceServer; 
  open: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstalled: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">{server.name}</DialogTitle>
            <Badge variant="outline">{server.category}</Badge>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <span>By {server.publisher}</span> • 
            <span>Version {server.version}</span> • 
            <span>Updated {new Date(server.lastUpdated).toLocaleDateString()}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground mb-4">{server.description}</p>
            
            <h3 className="text-lg font-semibold mb-2">Capabilities</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {server.capabilities.map(capability => (
                <Badge key={capability} variant="secondary">
                  {capability}
                </Badge>
              ))}
            </div>
            
            {server.requiresConfiguration && (
              <div className="bg-muted p-3 rounded-md mt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Icons.warning className="h-4 w-4" />
                  Configuration Required
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  This server requires additional configuration during installation.
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">Rating</h4>
                <span>{server.rating.toFixed(1)}/5.0</span>
              </div>
              <StarRating rating={server.rating} />
              
              <div className="flex justify-between items-center mt-4 mb-2">
                <h4 className="font-medium">Downloads</h4>
                <span>{server.downloads.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <h4 className="font-medium">Install Command</h4>
              </div>
              <code className="block bg-background p-2 rounded mt-1 text-xs overflow-x-auto">
                {server.installCommand} {server.args.join(' ')}
              </code>
            </div>
            
            <Button 
              className="w-full" 
              onClick={onInstall}
              disabled={isInstalled}
            >
              {isInstalled ? "Already Installed" : "Install Server"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Server installation dialog component
 */
function ServerInstallDialog({ 
  server, 
  open, 
  onClose,
  onInstall
}: { 
  server: MCPMarketplaceServer; 
  open: boolean;
  onClose: () => void;
  onInstall: (config?: Record<string, any>) => void;
}) {
  // Create form schema based on server configuration requirements
  const createFormSchema = () => {
    if (!server.requiresConfiguration || !server.configurationSchema) {
      return z.object({});
    }
    
    const schemaFields: Record<string, any> = {};
    
    // Add fields based on the configuration schema
    Object.entries(server.configurationSchema.properties).forEach(([key, prop]: [string, any]) => {
      const isRequired = server.configurationSchema?.required?.includes(key) || false;
      
      if (prop.type === 'string') {
        schemaFields[key] = isRequired ? z.string().min(1, { message: `${key} is required` }) : z.string().optional();
      } else if (prop.type === 'number') {
        schemaFields[key] = isRequired ? z.number({ required_error: `${key} is required` }) : z.number().optional();
      } else if (prop.type === 'boolean') {
        schemaFields[key] = z.boolean().optional();
      }
    });
    
    return z.object(schemaFields);
  };
  
  const formSchema = createFormSchema();
  
  // Create the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onInstall(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install MCP Server</DialogTitle>
          <DialogDescription>
            {server.requiresConfiguration
              ? "Configure the server before installation"
              : "Ready to install this MCP server"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {server.requiresConfiguration && server.configurationSchema ? (
              <div className="space-y-4">
                {Object.entries(server.configurationSchema.properties).map(([key, prop]: [string, any]) => {
                  const isRequired = server.configurationSchema?.required?.includes(key) || false;
                  
                  if (prop.type === 'boolean') {
                    return (
                      <FormField
                        key={key}
                        control={form.control}
                        name={key}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                {key}
                                {isRequired && <span className="text-destructive"> *</span>}
                              </FormLabel>
                              {prop.description && (
                                <p className="text-sm text-muted-foreground">
                                  {prop.description}
                                </p>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />
                    );
                  }
                  
                  return (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {key}
                            {isRequired && <span className="text-destructive"> *</span>}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type={prop.type === 'number' ? 'number' : 'text'}
                              placeholder={prop.description}
                            />
                          </FormControl>
                          {prop.description && (
                            <p className="text-xs text-muted-foreground">
                              {prop.description}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p>No additional configuration required.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click install to add this server to your configuration.
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Install
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}