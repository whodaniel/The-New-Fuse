import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, } from '@/components/core';
import { Save } from 'lucide-react';
const Settings = () => {
    const handleSave = async (e) => {
        e.preventDefault();
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure global system settings and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Basic system configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">System Name</label>
              <Input defaultValue="The New Fuse"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <Input type="email" defaultValue="support@example.com"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Time Zone</label>
              <Input defaultValue="UTC"/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Security and authentication configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Session Timeout (minutes)
              </label>
              <Input type="number" defaultValue="30"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Maximum Login Attempts
              </label>
              <Input type="number" defaultValue="5"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Password Expiry (days)
              </label>
              <Input type="number" defaultValue="90"/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Limits</CardTitle>
            <CardDescription>
              System-wide resource allocation limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Workspaces per User
              </label>
              <Input type="number" defaultValue="5"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Members per Workspace
              </label>
              <Input type="number" defaultValue="20"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Storage Limit per Workspace (GB)
              </label>
              <Input type="number" defaultValue="100"/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Neural Network Settings</CardTitle>
            <CardDescription>
              Neural network processing configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Concurrent Networks
              </label>
              <Input type="number" defaultValue="10"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Processing Time Limit (seconds)
              </label>
              <Input type="number" defaultValue="300"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Memory Limit per Network (GB)
              </label>
              <Input type="number" defaultValue="4"/>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="mr-2 h-4 w-4"/>
            Save Settings
          </Button>
        </div>
      </form>
    </div>);
};
export default Settings;
//# sourceMappingURL=Settings.js.map