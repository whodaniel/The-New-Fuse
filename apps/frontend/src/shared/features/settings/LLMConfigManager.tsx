import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { Input } from '@/shared/ui/core/Input';
import { Select } from '@/components/ui/select';
import { Button } from '@/shared/ui/core/Button';
import { SUPPORTED_PROVIDERS, PROVIDER_DEFAULTS, validateProviderConfig } from '@/services/llm/providers';
export function LLMConfigManager({ currentConfig, onConfigUpdate }) {
    const [config, setConfig] = React.useState(currentConfig);
    const [isValidating, setIsValidating] = React.useState(false);
    const [validationError, setValidationError] = React.useState(null);
    const handleProviderChange = React.useCallback((provider) => {
        const defaults = PROVIDER_DEFAULTS[provider];
        setConfig((prev: any) => (Object.assign(Object.assign(Object.assign({}, prev), defaults), { apiKey: prev.apiKey })));
    }, []);
    const handleParameterChange = React.useCallback((param, value) => {
        setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { parameters: Object.assign(Object.assign({}, prev.parameters), { [param]: value }) })));
    }, []);
    const handleValidateAndSave = React.useCallback(async () => {
        setIsValidating(true);
        setValidationError(null);
        try {
            const isValid = await validateProviderConfig(config);
            if (isValid) {
                onConfigUpdate === null || onConfigUpdate === void 0 ? void 0 : onConfigUpdate(config);
            }
            else {
                setValidationError('Invalid configuration. Please check your settings.');
            }
        }
        catch (error) {
            setValidationError('Error validating configuration.');
        }
        finally {
            setIsValidating(false);
        }
    }, [config, onConfigUpdate]);
    return (<Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">LLM Provider Configuration</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-medium">Provider</label>
          <Select value={config.name} onChange={handleProviderChange}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select Provider"/>
            </Select.Trigger>
            <Select.Content>
              {Object.values(SUPPORTED_PROVIDERS).map(provider => (<Select.Item key={provider} value={provider}>
                  {PROVIDER_DEFAULTS[provider].name}
                </Select.Item>))}
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">API Key</label>
          <Input type="password" value={config.apiKey || ''} onChange={(e: any) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { apiKey: e.target.value })))} placeholder="Enter API key"/>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Model</label>
          <Input value={config.model} onChange={(e: any) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { model: e.target.value })))} placeholder="Model name"/>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Parameters</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-medium">Temperature</label>
              <Input type="number" min={0} max={2} step={0.1} value={config.parameters.temperature.toString()} onChange={(e: any) => handleParameterChange('temperature', parseFloat(e.target.value))}/>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Max Tokens</label>
              <Input type="number" min={1} value={config.parameters.maxTokens.toString()} onChange={(e: any) => handleParameterChange('maxTokens', parseInt(e.target.value, 10))}/>
            </div>
          </div>
        </div>

        {validationError && (<div className="text-red-500 text-sm">{validationError}</div>)}

        <Button onClick={handleValidateAndSave} disabled={isValidating} className="w-full">
          {isValidating ? 'Validating...' : 'Save Configuration'}
        </Button>
      </div>
    </Card>);
}
//# sourceMappingURL=LLMConfigManager.js.map