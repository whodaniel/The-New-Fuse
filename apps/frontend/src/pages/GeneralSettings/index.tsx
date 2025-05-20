import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
const GeneralSettings = () => {
    return (<div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="embedding">Embedding</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Workspace Name
                  </div>
                  <Input placeholder="My Workspace"/>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Default Language
                  </div>
                  <Input placeholder="English"/>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="auto-save"/>
                  <div className="text-sm font-medium">
                    Enable Auto-save
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Theme
                  </div>
                  <div className="flex space-x-4">
                    <Button variant="outline">Light</Button>
                    <Button variant="outline">Dark</Button>
                    <Button variant="outline">System</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Font Size
                  </div>
                  <div className="flex space-x-4">
                    <Button variant="outline">Small</Button>
                    <Button variant="outline">Medium</Button>
                    <Button variant="outline">Large</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="embedding" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Embedding Model
                  </div>
                  <Input placeholder="text-embedding-ada-002"/>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Embedding Dimensions
                  </div>
                  <Input type="number" placeholder="1536"/>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="cache-embeddings"/>
                  <div className="text-sm font-medium">
                    Cache Embeddings
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications"/>
                  <div className="text-sm font-medium">
                    Email Notifications
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="desktop-notifications"/>
                  <div className="text-sm font-medium">
                    Desktop Notifications
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="sound-notifications"/>
                  <div className="text-sm font-medium">
                    Sound Notifications
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>);
};
export default GeneralSettings;
//# sourceMappingURL=index.js.map