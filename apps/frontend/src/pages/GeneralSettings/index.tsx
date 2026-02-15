import {
  PremiumButton as Button,
  GlassCard as Card,
  PremiumInput as Input,
} from '@/components/ui/premium';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
const GeneralSettings = () => {
  return (
    <div className="container mx-auto py-6">
      <Card title="General Settings" gradient="blue">
        <div className="space-y-4">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="embedding">Embedding</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <Input label="Workspace Name" placeholder="My Workspace" />

                <Input label="Default Language" placeholder="English" />

                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="auto-save" />
                  <div className="text-sm font-medium text-white">Enable Auto-save</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-400">Theme</div>
                  <div className="flex space-x-4">
                    <Button variant="outline">Light</Button>
                    <Button variant="outline">Dark</Button>
                    <Button variant="outline">System</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-400">Font Size</div>
                  <div className="flex space-x-4">
                    <Button variant="outline">Small</Button>
                    <Button variant="outline">Medium</Button>
                    <Button variant="outline">Large</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="embedding" className="space-y-4">
              <div className="space-y-4 pt-2">
                <Input label="Embedding Model" placeholder="text-embedding-ada-002" />

                <Input label="Embedding Dimensions" type="number" placeholder="1536" />

                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="cache-embeddings" />
                  <div className="text-sm font-medium text-white">Cache Embeddings</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" />
                  <div className="text-sm font-medium text-white">Email Notifications</div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="desktop-notifications" />
                  <div className="text-sm font-medium text-white">Desktop Notifications</div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="sound-notifications" />
                  <div className="text-sm font-medium text-white">Sound Notifications</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end space-x-2 border-t border-white/5 pt-6">
            <Button variant="outline">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default GeneralSettings;
