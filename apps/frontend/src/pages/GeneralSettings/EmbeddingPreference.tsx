import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const EmbeddingPreference = () => {
    return (<div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Embedding Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Default Embedding Model
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select model"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ada">text-embedding-ada-002</SelectItem>
                  <SelectItem value="bge">bge-large-en</SelectItem>
                  <SelectItem value="e5">e5-large-v2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">
                Embedding Dimensions
              </div>
              <Input type="number" placeholder="1536"/>
              <p className="text-sm text-gray-500">
                Higher dimensions may provide better accuracy but require more computational resources
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">
                Batch Size
              </div>
              <Input type="number" placeholder="32"/>
              <p className="text-sm text-gray-500">
                Number of texts to embed in parallel
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="cache-embeddings"/>
                <div className="text-sm font-medium">
                  Cache Embeddings
                </div>
              </div>
              <p className="text-sm text-gray-500 pl-14">
                Store embeddings in cache to improve performance for frequently accessed content
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="normalize-embeddings"/>
                <div className="text-sm font-medium">
                  Normalize Embeddings
                </div>
              </div>
              <p className="text-sm text-gray-500 pl-14">
                L2 normalize embedding vectors before storing
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>);
};
export default EmbeddingPreference;
//# sourceMappingURL=EmbeddingPreference.js.map