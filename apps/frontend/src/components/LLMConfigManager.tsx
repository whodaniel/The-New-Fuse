Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMConfigManager = LLMConfigManager;
import react_1 from 'react';
import providers_1 from '../../services/llm/providers.js';
import ui_1 from '../ui.js';
function LLMConfigManager({ currentConfig, onConfigUpdate }) {
    const [config, setConfig] = (0, react_1.useState)(currentConfig);
    const [isValidating, setIsValidating] = (0, react_1.useState)(false);
    const [validationError, setValidationError] = (0, react_1.useState)(null);
    const handleProviderChange = (0, react_1.useCallback)((provider) => {
        const defaults = providers_1.PROVIDER_DEFAULTS[provider];
        setConfig((prev: any) => (Object.assign(Object.assign(Object.assign({}, prev), defaults), { apiKey: prev.apiKey })));
    }, []);
    const handleParameterChange = (0, react_1.useCallback)((param, value) => {
        setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { parameters: Object.assign(Object.assign({}, prev.parameters), { [param]: value }) })));
    }, []);
    const handleValidateAndSave = (0, react_1.useCallback)(async () => {
        setIsValidating(true);
        setValidationError(null);
        try {
            const isValid = await (0, providers_1.validateProviderConfig)(config);
            if (isValid) {
                onConfigUpdate(config);
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
    return (<ui_1.Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold mb-4">LLM Provider Configuration</h2>
      
      <div className="space-y-4">
        <div>
          <ui_1.Label>Provider</ui_1.Label>
          <ui_1.Select value={config.name} onChange={(e: any) => handleProviderChange(e.target.value)} options={Object.values(providers_1.SUPPORTED_PROVIDERS).map(provider => ({
            label: providers_1.PROVIDER_DEFAULTS[provider].name,
            value: provider,
        }))}/>
        </div>

        <div>
          <ui_1.Label>API Key</ui_1.Label>
          <ui_1.Input type="password" value={config.apiKey || ''} onChange={(e: any) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { apiKey: e.target.value })))} placeholder="Enter API key"/>
        </div>

        <div>
          <ui_1.Label>Model</ui_1.Label>
          <ui_1.Input value={config.model} onChange={(e: any) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { model: e.target.value })))} placeholder="Model name"/>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Parameters</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <ui_1.Label>Temperature</ui_1.Label>
              <ui_1.Input type="number" min={0} max={2} step={0.1} value={config.parameters.temperature} onChange={(e: any) => handleParameterChange('temperature', parseFloat(e.target.value))}/>
            </div>

            <div>
              <ui_1.Label>Max Tokens</ui_1.Label>
              <ui_1.Input type="number" min={1} max={32768} value={config.parameters.maxTokens} onChange={(e: any) => handleParameterChange('maxTokens', parseInt(e.target.value))}/>
            </div>

            <div>
              <ui_1.Label>Top P</ui_1.Label>
              <ui_1.Input type="number" min={0} max={1} step={0.1} value={config.parameters.topP} onChange={(e: any) => handleParameterChange('topP', parseFloat(e.target.value))}/>
            </div>

            <div>
              <ui_1.Label>Frequency Penalty</ui_1.Label>
              <ui_1.Input type="number" min={-2} max={2} step={0.1} value={config.parameters.frequencyPenalty} onChange={(e: any) => handleParameterChange('frequencyPenalty', parseFloat(e.target.value))}/>
            </div>
          </div>
        </div>

        {validationError && (<div className="text-red-500 text-sm">{validationError}</div>)}

        <ui_1.Button onClick={handleValidateAndSave} disabled={isValidating} className="w-full">
          {isValidating ? 'Validating...' : 'Save Configuration'}
        </ui_1.Button>
      </div>
    </ui_1.Card>);
}
export {};
//# sourceMappingURL=LLMConfigManager.js.map