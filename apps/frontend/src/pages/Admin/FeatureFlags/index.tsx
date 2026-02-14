import React, { useState, useEffect } from 'react';
import { FeatureFlagConditionsEditor } from '../../../components/AdminPanel/FeatureFlagConditions';
import { FeatureFlag, FeatureFlagConditions } from '@the-new-fuse/types/featureFlags';
import {
  GlassCard as Card,
  PremiumButton as Button,
  PremiumInput as Input,
} from '@/components/ui/premium';
import { toast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';

export default function FeatureFlagsAdmin() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);
  const [editingConditions, setEditingConditions] = useState<FeatureFlagConditions>({});

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const response = await fetch('/api/admin/features');
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      toast.error('Failed to load features');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createFeature(data: Partial<FeatureFlag>) {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create feature');
      
      toast.success('Feature created successfully');
      await loadFeatures();
    } catch (error) {
      toast.error('Failed to create feature');
      console.error(error);
    }
  }

  async function updateFeature(id: string, data: Partial<FeatureFlag>) {
    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update feature');
      
      toast.success('Feature updated successfully');
      await loadFeatures();
    } catch (error) {
      toast.error('Failed to update feature');
      console.error(error);
    }
  }

  async function deleteFeature(id: string) {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete feature');
      
      toast.success('Feature deleted successfully');
      await loadFeatures();
    } catch (error) {
      toast.error('Failed to delete feature');
      console.error(error);
    }
  }

  if (loading) {
    return <div>Loading features...</div>;
  }

  return (
    <div className=\"p-6\">
      <div className=\"flex justify-between items-center mb-6\">
        <h1 className=\"text-2xl font-bold text-white\">Feature Flags</h1>
        <Button variant=\"primary\" onClick={() => setSelectedFeature({
          name: '',
          description: '',
          enabled: false,
          stage: 'development',
          priority: 'medium',
          conditions: {}
        } as FeatureFlag)}>
          Create Feature
        </Button>
      </div>

      <div className=\"grid gap-6 grid-cols-1 lg:grid-cols-2\">
        <Card title=\"Feature List\" gradient=\"blue\">
          <div className=\"space-y-4\">
            {features.map((feature: any) => (
              <Card key={feature.id} gradient=\"purple\" hover className=\"cursor-pointer\"
                onClick={() => {
                  setSelectedFeature(feature);
                  setEditingConditions(feature.conditions || {});
                }}>
                <div className=\"flex items-center justify-between\">
                  <div>
                    <h3 className=\"font-medium text-white\">{feature.name}</h3>
                    <p className=\"text-sm text-gray-400\">{feature.description}</p>
                  </div>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(checked) => updateFeature(feature.id, { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className=\"flex gap-2 mt-2 text-sm\">
                  <span className=\"bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/20\">{feature.stage}</span>
                  <span className=\"bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/20\">{feature.priority}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedFeature && (
          <Card 
            title={selectedFeature.id ? 'Edit Feature' : 'New Feature'} 
            gradient=\"orange\"
          >
            <div className=\"absolute top-6 right-6\">
              {selectedFeature.id && (
                <Button
                  variant=\"danger\"
                  size=\"sm\"
                  onClick={() => deleteFeature(selectedFeature.id)}
                >
                  Delete
                </Button>
              )}
            </div>

            <Tabs defaultValue=\"details\">
              <Tabs.List>
                <Tabs.Trigger value="details">Details</Tabs.Trigger>
                <Tabs.Trigger value="conditions">Conditions</Tabs.Trigger>
                <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="details" className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input
                    value={selectedFeature.name}
                    onChange={(e) => setSelectedFeature({
                      ...selectedFeature,
                      name: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <Input
                    value={selectedFeature.description}
                    onChange={(e) => setSelectedFeature({
                      ...selectedFeature,
                      description: e.target.value
                    })}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm mb-1">Stage</label>
                    <select
                      title="Select an option"
                      aria-label="Select an option"
                      value={selectedFeature.stage}
                      onChange={(e) => setSelectedFeature({
                        ...selectedFeature,
                        stage: e.target.value
                      })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="development">Development</option>
                      <option value="testing">Testing</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Priority</label>
                    <select
                      title="Select an option"
                      aria-label="Select an option"
                      value={selectedFeature.priority}
                      onChange={(e) => setSelectedFeature({
                        ...selectedFeature,
                        priority: e.target.value
                      })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedFeature.enabled}
                    onCheckedChange={(checked) => setSelectedFeature({
                      ...selectedFeature,
                      enabled: checked
                    })}
                  />
                  <span>Enabled</span>
                </div>
              </Tabs.Content>

              <Tabs.Content value="conditions" className="mt-4">
                <FeatureFlagConditionsEditor
                  conditions={editingConditions}
                  onChange={(conditions) => {
                    setEditingConditions(conditions);
                    setSelectedFeature({
                      ...selectedFeature,
                      conditions
                    });
                  }}
                />
              </Tabs.Content>

              <Tabs.Content value=\"metrics\" className=\"mt-4\">
                {selectedFeature.id ? (
                  <div className=\"space-y-4\">
                    <div className=\"grid grid-cols-2 gap-4\">
                      <Card title=\"Usage\" gradient=\"blue\">
                        <div className=\"text-2xl font-bold text-white\">
                          {selectedFeature.metadata?.metrics?.usageCount || 0}
                        </div>
                      </Card>
                      <Card title=\"Errors\" gradient=\"red\">
                        <div className=\"text-2xl font-bold text-red-400\">
                          {selectedFeature.metadata?.metrics?.errors || 0}
                        </div>
                      </Card>
                      <Card title=\"Exposures\" gradient=\"purple\">
                        <div className=\"text-2xl font-bold text-white\">
                          {selectedFeature.metadata?.metrics?.exposures || 0}
                        </div>
                      </Card>
                      <Card title=\"Positive Evaluations\" gradient=\"green\">
                        <div className=\"text-2xl font-bold text-green-400\">
                          {selectedFeature.metadata?.metrics?.positiveEvaluations || 0}
                        </div>
                      </Card>
                    </div>
                    <div className=\"p-4 rounded-xl bg-black/20 border border-white/5\">
                      <h4 className=\"font-medium text-gray-400 mb-1\">Last Used</h4>
                      <div className=\"text-white\">
                        {selectedFeature.metadata?.metrics?.lastUsed
                          ? new Date(selectedFeature.metadata.metrics.lastUsed).toLocaleString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Metrics will be available after creating the feature.
                  </div>
                )}
              </Tabs.Content>
            </Tabs>

            <div className=\"flex justify-end mt-6 space-x-2\">
              <Button
                variant=\"outline\"
                onClick={() => {
                  setSelectedFeature(null);
                  setEditingConditions({});
                }}
              >
                Cancel
              </Button>
              <Button
                variant=\"primary\"
                onClick={() => {
                  if (selectedFeature.id) {
                    updateFeature(selectedFeature.id, {
                      ...selectedFeature,
                      conditions: editingConditions
                    });
                  } else {
                    createFeature({
                      ...selectedFeature,
                      conditions: editingConditions
                    });
                  }
                  setSelectedFeature(null);
                  setEditingConditions({});
                }}
              >
                {selectedFeature.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}