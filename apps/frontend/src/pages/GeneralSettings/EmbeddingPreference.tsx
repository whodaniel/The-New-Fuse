import React from 'react';
import { 
  GlassCard as Card,
  PremiumButton as Button,
  PremiumInput as Input,
  PremiumSelect as Select,
} from '@/components/ui/premium';
import { Switch } from '@/components/ui/switch';
const EmbeddingPreference = () => {
    return (<div className=\"container mx-auto py-6\">
      <Card title=\"Embedding Preferences\" gradient=\"purple\">
        <div className=\"space-y-6\">
          <div className=\"space-y-6\">
            <Select 
              label=\"Default Embedding Model\"
              options={[
                { value: 'ada', label: 'text-embedding-ada-002' },
                { value: 'bge', label: 'bge-large-en' },
                { value: 'e5', label: 'e5-large-v2' },
              ]}
            />

            <Input 
              label=\"Embedding Dimensions\" 
              type=\"number\" 
              placeholder=\"1536\"
              hint=\"Higher dimensions may provide better accuracy but require more computational resources\"
            />

            <Input 
              label=\"Batch Size\" 
              type=\"number\" 
              placeholder=\"32\"
              hint=\"Number of texts to embed in parallel\"
            />

            <div className=\"space-y-4 pt-2\">
              <div className=\"flex items-center space-x-2\">
                <Switch id=\"cache-embeddings\"/>
                <div className=\"text-sm font-medium text-white\">
                  Cache Embeddings
                </div>
              </div>
              <p className=\"text-xs text-gray-500 pl-14\">
                Store embeddings in cache to improve performance for frequently accessed content
              </p>
            </div>

            <div className=\"space-y-4\">
              <div className=\"flex items-center space-x-2\">
                <Switch id=\"normalize-embeddings\"/>
                <div className=\"text-sm font-medium text-white\">
                  Normalize Embeddings
                </div>
              </div>
              <p className=\"text-xs text-gray-500 pl-14\">
                L2 normalize embedding vectors before storing
              </p>
            </div>
          </div>

          <div className=\"pt-6 flex justify-end space-x-2 border-t border-white/5\">
            <Button variant=\"outline\">Reset to Defaults</Button>
            <Button variant=\"primary\">Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>);
};
export default EmbeddingPreference;
