import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const availableModules = [
  {
    category: 'Core',
    modules: [
      { name: 'User Authentication', description: 'Secure user login and registration system' },
      { name: 'Database Integration', description: "Connect and manage your app's data" },
      { name: 'Payment Processing', description: 'Handle transactions securely' },
      { name: 'Analytics Dashboard', description: 'Track and visualize app usage data' },
    ],
  },
  {
    category: 'Media & Content',
    modules: [
      {
        name: 'Media Player',
        description: 'Play audio and video content with customizable controls',
      },
      { name: 'Image Gallery', description: 'Display and manage image collections' },
      { name: 'Content Editor', description: 'Rich text editing capabilities' },
      { name: 'File Manager', description: 'Upload and manage files' },
    ],
  },
];

export function AppCreator() {
  const [appName, setAppName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [customizationOptions, setCustomizationOptions] = useState({
    theme: 'light',
    primaryColor: '#4444FF',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleModuleToggle = (moduleName: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleName) ? prev.filter((name) => name !== moduleName) : [...prev, moduleName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccessMessage('App created successfully!');
    } catch (err) {
      setError('Failed to create app. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New App</CardTitle>
            <CardDescription>Configure your app's basic information and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>App Name</Label>
                <Input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Creator Name</Label>
                <Input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Select Modules</Label>
              {availableModules.map((category) => (
                <div key={category.category} className="space-y-2">
                  <h3 className="font-medium text-gray-700">{category.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.modules.map((module) => (
                      <Card
                        key={module.name}
                        className={`cursor-pointer transition-all ${
                          selectedModules.includes(module.name)
                            ? 'bg-blue-100 border-blue-500'
                            : 'bg-white'
                        }`}
                        onClick={() => handleModuleToggle(module.name)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{module.name}</h4>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Label>Customization</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Theme</Label>
                  <select
                    aria-label="Theme"
                    value={customizationOptions.theme}
                    onChange={(e) =>
                      setCustomizationOptions((prev) => ({ ...prev, theme: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div>
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={customizationOptions.primaryColor}
                    onChange={(e) =>
                      setCustomizationOptions((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()} disabled={isLoading}>
            Reset
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create App'}
          </Button>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
        {successMessage && (
          <div className="p-4 bg-green-50 text-green-600 rounded-lg">{successMessage}</div>
        )}
      </form>
    </div>
  );
}
