import * as React from 'react';
import { createRoot } from 'react-dom/client'; // For React 18

// Define types for our component state and props
interface Provider {
  id: string;
  name: string;
  requiresApiKey: boolean;
  description: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
}

interface ModelSelectorState {
  providers: Provider[];
  selectedProvider: string | null;
  models: Model[];
  apiKey: string;
  error: string | null;
  success: string | null;
  loading: boolean; 
}

// VSCode API type
interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}
declare const acquireVsCodeApi: () => VsCodeApi;

// Create the main ModelSelector component
const ModelSelector: React.FC = () => {
  const [state, setState] = React.useState<ModelSelectorState>({
    providers: [],
    selectedProvider: null,
    models: [],
    apiKey: '',
    error: null,
    success: null,
    loading: false,
  });

  // Get the VS Code API instance
  const vscode = React.useMemo(() => acquireVsCodeApi(), []);

  // Handle provider selection
  const handleProviderSelect = (providerId: string) => {
    setState(prevState => ({ ...prevState, selectedProvider: providerId, models: [], apiKey: '', error: null, success: null }));
    vscode.postMessage({
      command: 'selectProvider',
      providerId
    });
  };

  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    if (state.selectedProvider) {
      vscode.postMessage({
        command: 'selectModel',
        providerId: state.selectedProvider,
        modelId
      });
    }
  };

  // Handle API key input change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prevState => ({ ...prevState, apiKey: e.target.value }));
  };

  // Handle API key save
  const handleSaveApiKey = () => {
    if (state.selectedProvider && state.apiKey) {
      vscode.postMessage({
        command: 'saveApiKey',
        providerId: state.selectedProvider,
        apiKey: state.apiKey
      });
    }
  };

  // Effect for handling messages from the extension
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data; // The data VS Code extension sent
      switch (message.command) {
        case 'updateProviders':
          setState(prevState => ({ ...prevState, providers: message.providers, loading: false, error: null }));
          break;
        case 'updateModels':
          // Ensure we only update models if the providerId matches the currently selected one,
          // or if selectedProvider is null (initial load for a pre-selected provider perhaps)
          if (state.selectedProvider === message.providerId || !state.selectedProvider) {
            setState(prevState => ({ ...prevState, models: message.models, loading: false, error: null }));
          }
          break;
        case 'showError':
          setState(prevState => ({ ...prevState, error: message.message, success: null, loading: false }));
          break;
        case 'showSuccess':
          setState(prevState => ({ ...prevState, success: message.message, error: null, loading: false }));
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode, state.selectedProvider]); // Listen to changes on selectedProvider to potentially clear models or re-fetch if necessary

  // Effect for initial loading of providers
  React.useEffect(() => {
    // Request initial providers when the component mounts
    vscode.postMessage({ command: 'loadProviders' });
    setState(prevState => ({ ...prevState, loading: true }));
  }, [vscode]); // Only run once on mount, as vscode instance is stable

  const selectedProviderDetails = state.providers.find(p => p.id === state.selectedProvider);

  return (
    <div className="container">
      <div className="header">
        <h1>AI Model Selection</h1>
        <p>Select an AI provider and model to use with The Fuse</p>
      </div>

      {state.error && <div className="message error-message">{state.error}</div>}
      {state.success && <div className="message success-message">{state.success}</div>}
      {state.loading && <div className="message loading-message">Loading...</div>}


      <div className="panel">
        <h2>Step 1: Select an AI Provider</h2>
        {state.providers.length === 0 && !state.loading && !state.error && <p>No providers available.</p>}
        <div className="provider-list">
          {state.providers.map(provider => (
            <div 
              key={provider.id}
              className={`model-card ${state.selectedProvider === provider.id ? 'selected' : ''}`}
              onClick={() => handleProviderSelect(provider.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleProviderSelect(provider.id)}
            >
              <div className="model-name">{provider.name}</div>
              <div className="model-description">{provider.description}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedProviderDetails && (
        <>
          {selectedProviderDetails.requiresApiKey && (
            <div className="panel api-key-form">
              <h2>API Key Configuration for {selectedProviderDetails.name}</h2>
              <p>Enter your API key for {selectedProviderDetails.name}</p>
              <input 
                type="password"
                value={state.apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter API key"
              />
              <button onClick={handleSaveApiKey} disabled={!state.apiKey.trim()}>Save API Key</button>
            </div>
          )}

          <div className="panel">
            <h2>Step 2: Select a Model from {selectedProviderDetails.name}</h2>
            {state.models.length === 0 && !state.loading && !state.error && <p>No models available for this provider. Models will load after selecting a provider.</p>}
            <div className="model-list">
              {state.models.map(model => (
                <div 
                  key={model.id}
                  className="model-card" // Consider adding a 'selected' class for the chosen model too
                  onClick={() => handleModelSelect(model.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleModelSelect(model.id)}
                >
                  <div className="model-name">{model.name}</div>
                  <div className="model-description">{model.description}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Render the component to the DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<React.StrictMode><ModelSelector /></React.StrictMode>);
}