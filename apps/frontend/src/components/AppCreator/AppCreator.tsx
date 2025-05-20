"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppCreator = AppCreator;
import react_1 from 'react';
import ui_1 from '../../shared/components/ui.js';
function AppCreator() {
    const [appName, setAppName] = (0, react_1.useState)('');
    const [creatorName, setCreatorName] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const [selectedModules, setSelectedModules] = (0, react_1.useState)([]);
    const [customizationOptions, setCustomizationOptions] = (0, react_1.useState)({
        theme: 'light',
        primaryColor: '#4444FF',
        fontSize: 16,
        fontFamily: 'Inter',
        buttonStyle: 'rounded',
    });
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [successMessage, setSuccessMessage] = (0, react_1.useState)('');
    const [mediaAssets, setMediaAssets] = (0, react_1.useState)([]);
    const [socialLinks, setSocialLinks] = (0, react_1.useState)([]);
    const [nestedApps, setNestedApps] = (0, react_1.useState)([]);
    const availableModules = [
        {
            category: 'Core',
            modules: [
                { name: 'User Authentication', description: 'Secure user login and registration system' },
                { name: 'Database Integration', description: 'Connect and manage your app\'s data' },
                { name: 'Payment Processing', description: 'Handle transactions securely' },
                { name: 'Analytics Dashboard', description: 'Track and visualize app usage data' },
            ]
        },
        {
            category: 'Media & Content',
            modules: [
                { name: 'Media Player', description: 'Play audio and video content with customizable controls' },
                { name: 'Image Gallery', description: 'Display and manage image collections' },
                { name: 'Content Editor', description: 'Rich text editing capabilities' },
                { name: 'File Manager', description: 'Upload and manage files' },
            ]
        }
    ];
    const handleModuleToggle = (moduleName) => {
        setSelectedModules((prev: any) => prev.includes(moduleName)
            ? prev.filter(nam(e: any) => name !== moduleName)
            : [...prev, moduleName]);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await new Promise(resolv(e: any) => setTimeout(resolve, 2000));
            setSuccessMessage('App created successfully!');
        }
        catch (err) {
            setError('Failed to create app. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ui_1.Card>
          <ui_1.CardHeader>
            <ui_1.CardTitle>Create New App</ui_1.CardTitle>
            <ui_1.CardDescription>
              Configure your app's basic information and features
            </ui_1.CardDescription>
          </ui_1.CardHeader>
          <ui_1.CardContent className="space-y-4">
            
            <div className="space-y-4">
              <div>
                <ui_1.Label variant="required">App Name</ui_1.Label>
                <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required/>
              </div>
              
              <div>
                <ui_1.Label>Creator Name</ui_1.Label>
                <input type="text" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <ui_1.Label>Description</ui_1.Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={4}/>
              </div>
            </div>

            <div className="space-y-4">
              <ui_1.Label>Select Modules</ui_1.Label>
              {availableModules.map(category => (<div key={category.category} className="space-y-2">
                  <h3 className="font-medium text-gray-700">{category.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.modules.map(modul(e: any) => (<ui_1.Card key={module.name} variant={selectedModules.includes(module.name) ? 'gradient' : 'default'} className="cursor-pointer transition-all" onClick={() => handleModuleToggle(module.name)}>
                        <ui_1.CardContent className="p-4">
                          <h4 className="font-medium">{module.name}</h4>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </ui_1.CardContent>
                      </ui_1.Card>))}
                  </div>
                </div>))}
            </div>

            <div className="space-y-4">
              <ui_1.Label>Customization</ui_1.Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ui_1.Label size="small">Theme</ui_1.Label>
                  <select value={customizationOptions.theme} onChange={(e) => setCustomizationOptions((prev: any) => (Object.assign(Object.assign({}, prev), { theme: e.target.value })))} className="w-full mt-1 px-3 py-2 border rounded-lg">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div>
                  <ui_1.Label size="small">Primary Color</ui_1.Label>
                  <input type="color" value={customizationOptions.primaryColor} onChange={(e) => setCustomizationOptions((prev: any) => (Object.assign(Object.assign({}, prev), { primaryColor: e.target.value })))} className="w-full mt-1"/>
                </div>
              </div>
            </div>
          </ui_1.CardContent>
        </ui_1.Card>

        <div className="flex justify-end space-x-4">
          <ui_1.Button variant="default" onClick={() => window.location.reload()} disabled={isLoading}>
            Reset
          </ui_1.Button>
          <ui_1.Button variant="gradient" type="submit" loading={isLoading}>
            Create App
          </ui_1.Button>
        </div>

        {error && (<div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>)}
        {successMessage && (<div className="p-4 bg-green-50 text-green-600 rounded-lg">
            {successMessage}
          </div>)}
      </form>
    </div>);
}
exports.default = AppCreator;
export {};
//# sourceMappingURL=AppCreator.js.map