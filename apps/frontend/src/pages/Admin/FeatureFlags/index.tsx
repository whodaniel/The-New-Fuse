import React, { useState, useEffect } from 'react';
import { FeatureFlagConditionsEditor } from '../../../components/AdminPanel/FeatureFlagConditions.js';
import { FeatureFlag, FeatureFlagConditions, Environment } from '@the-new-fuse/core/types/featureFlags';
import { Button, Card, Input, Switch, Tabs, Toast } from '@the-new-fuse/ui-consolidated';

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
      Toast.error('Failed to load features');
      console.error('Failed to load features:', error);
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
      
      Toast.success('Feature created successfully');
      await loadFeatures();
    } catch (error) {
      Toast.error('Failed to create feature');
      console.error('Failed to create feature:', error);
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
      
      Toast.success('Feature updated successfully');
      await loadFeatures();
    } catch (error) {
      Toast.error('Failed to update feature');
      console.error('Failed to update feature:', error);
    }
  }

  async function deleteFeature(id: string) {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete feature');
      
      Toast.success('Feature deleted successfully');
      await loadFeatures();
    } catch (error) {
      Toast.error('Failed to delete feature');
      console.error('Failed to delete feature:', error);
    }
  }

  if (loading) {
    return <div>Loading features...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <Button onClick={() => setSelectedFeature({
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

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Feature List</h2>
          <div className="space-y-4">
            {features.map(featur(e: any) => (
              <Card key={feature.id} className="p-4 hover:bg-secondary/50 cursor-pointer"
                onClick={() => {
                  setSelectedFeature(feature);
                  setEditingConditions(feature.conditions || {});
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(checked) => updateFeature(feature.id, { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex gap-2 mt-2 text-sm">
                  <span className="bg-primary/10 px-2 py-1 rounded">{feature.stage}</span>
                  <span className="bg-primary/10 px-2 py-1 rounded">{feature.priority}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedFeature && (
          <Card className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">
                {selectedFeature.id ? 'Edit Feature' : 'New Feature'}
              </h2>
              {selectedFeature.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteFeature(selectedFeature.id)}
                >
                  Delete
                </Button>
              )}
            </div>

            <Tabs defaultValue="details">
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

              <Tabs.Content value="metrics" className="mt-4">
                {selectedFeature.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Usage</h4>
                        <div className="text-2xl font-bold">
                          {selectedFeature.metadata?.metrics?.usageCount || 0}
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Errors</h4>
                        <div className="text-2xl font-bold text-destructive">
                          {selectedFeature.metadata?.metrics?.errors || 0}
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Exposures</h4>
                        <div className="text-2xl font-bold">
                          {selectedFeature.metadata?.metrics?.exposures || 0}
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Positive Evaluations</h4>
                        <div className="text-2xl font-bold text-success">
                          {selectedFeature.metadata?.metrics?.positiveEvaluations || 0}
                        </div>
                      </Card>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Last Used</h4>
                      <div>
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

            <div className="flex justify-end mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFeature(null);
                  setEditingConditions({});
                }}
              >
                Cancel
              </Button>
              <Button
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