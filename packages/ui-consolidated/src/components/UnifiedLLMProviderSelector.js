/**
 * Unified LLM Provider Selector
 *
 * Universal component for selecting and configuring LLM providers across all UIs.
 * Supports CLI agents, API providers, LiteLLM proxy, and custom agents.
 *
 * @module UnifiedLLMProviderSelector
 * @since 2025-10-06
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { Input } from './Input';
import { Label } from './Label';
import { Switch } from './Switch';
import { Alert, AlertDescription } from './Alert';
import { CheckCircle, XCircle, Clock, Settings, ExternalLink, RefreshCw } from 'lucide-react';
export const UnifiedLLMProviderSelector = ({ selectedProviderId, onProviderChange, onConfigChange, showAdvancedOptions = false, filterByType, filterByCapability, className = '' }) => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState({});
    // Load providers from API
    const loadProviders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/llm/providers');
            if (response.ok) {
                let allProviders = await response.json();
                // Apply filters
                if (filterByType && filterByType.length > 0) {
                    allProviders = allProviders.filter(p => filterByType.includes(p.type));
                }
                if (filterByCapability && filterByCapability.length > 0) {
                    allProviders = allProviders.filter(p => filterByCapability.some(cap => p.capabilities.includes(cap)));
                }
                setProviders(allProviders);
                // Set initial selection
                if (selectedProviderId) {
                    const provider = allProviders.find(p => p.id === selectedProviderId);
                    if (provider) {
                        setSelectedProvider(provider);
                    }
                }
                else if (allProviders.length > 0) {
                    const defaultProvider = allProviders.find(p => p.status === 'available') || allProviders[0];
                    setSelectedProvider(defaultProvider);
                    onProviderChange(defaultProvider.id, defaultProvider);
                }
            }
        }
        catch (error) {
            console.error('Failed to load providers:', error);
        }
        finally {
            setLoading(false);
        }
    }, [selectedProviderId, filterByType, filterByCapability, onProviderChange]);
    useEffect(() => {
        loadProviders();
    }, [loadProviders]);
    const handleProviderSelect = (providerId) => {
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
            setSelectedProvider(provider);
            onProviderChange(providerId, provider);
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'available':
                return <CheckCircle className="h-4 w-4 text-green-500"/>;
            case 'unavailable':
                return <XCircle className="h-4 w-4 text-red-500"/>;
            case 'checking':
                return <Clock className="h-4 w-4 text-yellow-500"/>;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500"/>;
            default:
                return <Clock className="h-4 w-4 text-gray-500"/>;
        }
    };
    const getCostTierColor = (tier) => {
        switch (tier) {
            case 'free':
                return 'bg-green-100 text-green-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'enterprise':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const groupedProviders = providers.reduce((groups, provider) => {
        const category = provider.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(provider);
        return groups;
    }, {});
    if (loading) {
        return (<div className={`flex items-center justify-center p-4 ${className}}>
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading providers...</span>
      </div>
    );
  }

  return (`
                < div} className={space - y - 4} $ {...className}/>) `}` >
            { /* Provider Selection */}
            < div;
        className = "space-y-2" >
            <Label htmlFor="provider-select">LLM Provider</Label>
                ,
                    <Select value={selectedProvider?.id || ''} onValueChange={handleProviderSelect}>
          <SelectTrigger id="provider-select">
            <SelectValue placeholder="Select an LLM provider"/>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedProviders).map(([category, categoryProviders]) => (<div key={category}>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                  {category} Providers
                </div>
                {categoryProviders.map((provider) => (<SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(provider.status)}
                      <span>{provider.displayName}</span>
                      <Badge variant="outline" className={getCostTierColor(provider.costTier)}>
                        {provider.costTier}
                      </Badge>
                      {provider.type === 'cli_agent' && (<Badge variant="secondary">CLI</Badge>)}
                    </div>
                  </SelectItem>))}
              </div>))}
          </SelectContent>
        </Select>;
    }
};
div >
    { /* Provider Details */};
{
    selectedProvider && (<Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedProvider.displayName}</CardTitle>
                <CardDescription>{selectedProvider.metadata.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedProvider.status)}
                <Badge className={getCostTierColor(selectedProvider.costTier)}>
                  {selectedProvider.costTier}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Vendor:</span> {selectedProvider.vendor}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedProvider.type.replace('_', ' ')}
              </div>
              <div>
                <span className="font-medium">Default Model:</span> {selectedProvider.defaultModel}
              </div>
              <div>
                <span className="font-medium">Models:</span> {selectedProvider.models.length}
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <span className="font-medium text-sm">Capabilities:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedProvider.capabilities.map((capability) => (<Badge key={capability} variant="outline" className="text-xs">
                    {capability.replace('_', ' ')}
                  </Badge>))}
              </div>
            </div>

            {/* Status Alert */}
            {selectedProvider.status !== 'available' && (<Alert>
                <AlertDescription>
                  {selectedProvider.status === 'unavailable' &&
                'This provider is currently unavailable. Check configuration and try again.'}
                  {selectedProvider.status === 'checking' &&
                'Checking provider availability...'}
                  {selectedProvider.status === 'error' &&
                'Provider error detected. Check logs for details.'}
                </AlertDescription>
              </Alert>)}

            {/* Actions */}
            <div className="flex gap-2">
              {showAdvancedOptions && (<Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
                  <Settings className="h-4 w-4 mr-1"/>
                  Configure
                </Button>)}
              
              {selectedProvider.documentation && (<Button variant="outline" size="sm" onClick={() => window.open(selectedProvider.documentation, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-1"/>
                  Docs
                </Button>)}
              
              <Button variant="outline" size="sm" onClick={loadProviders}>
                <RefreshCw className="h-4 w-4 mr-1"/>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>);
}
{ /* Advanced Configuration */ }
{
    showConfig && selectedProvider && (<Card>
          <CardHeader>
            <CardTitle className="text-lg">Provider Configuration</CardTitle>
            <CardDescription>
              Configure settings for {selectedProvider.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="models">Models</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                {selectedProvider.requiresApiKey && (<div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input id="api-key" type="password" placeholder="Enter API key" value={config.apiKey || ''} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}/>
                  </div>)}
                
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={config.model || selectedProvider.defaultModel} onValueChange={(value) => setConfig({ ...config, model: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider.models.map((model) => (<SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input id="temperature" type="number" min="0" max="2" step="0.1" value={config.temperature || 0.7} onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}/>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input id="max-tokens" type="number" value={config.maxTokens || 4096} onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}/>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="streaming" checked={config.streaming || false} onCheckedChange={(checked) => setConfig({ ...config, streaming: checked })}/>
                  <Label htmlFor="streaming">Enable Streaming</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="models" className="space-y-4">
                <div className="space-y-2">
                  <Label>Available Models</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {selectedProvider.models.map((model) => (<div key={model} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{model}</span>
                        {model === selectedProvider.defaultModel && (<Badge variant="secondary">Default</Badge>)}
                      </div>))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
            onConfigChange?.(config);
            setShowConfig(false);
        }}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>);
}
div >
;
;
;
//# sourceMappingURL=UnifiedLLMProviderSelector.js.map