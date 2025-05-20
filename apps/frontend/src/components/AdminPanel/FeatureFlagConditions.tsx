import React, { useState } from 'react';
import { Card, Input, Switch, Button, DatePicker, Select } from '@the-new-fuse/ui-consolidated';
import { FeatureFlagConditions } from '@the-new-fuse/core/types/featureFlags';
import { MonacoEditor } from '@the-new-fuse/ui-components/monaco-editor';

interface FeatureFlagConditionsEditorProps {
  conditions: FeatureFlagConditions;
  onChange: (conditions: FeatureFlagConditions) => void;
}

export function FeatureFlagConditionsEditor({
  conditions,
  onChange
}: FeatureFlagConditionsEditorProps) {
  const [activeTab, setActiveTab] = useState('environments');

  const updateConditions = (key: string, value: any) => {
    onChange({
      ...conditions,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === 'environments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('environments')}
        >
          Environments
        </Button>
        <Button
          variant={activeTab === 'userGroups' ? 'default' : 'outline'}
          onClick={() => setActiveTab('userGroups')}
        >
          User Groups
        </Button>
        <Button
          variant={activeTab === 'percentage' ? 'default' : 'outline'}
          onClick={() => setActiveTab('percentage')}
        >
          Percentage
        </Button>
        <Button
          variant={activeTab === 'dateRange' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dateRange')}
        >
          Date Range
        </Button>
        <Button
          variant={activeTab === 'deviceTypes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('deviceTypes')}
        >
          Device Types
        </Button>
        <Button
          variant={activeTab === 'customRules' ? 'default' : 'outline'}
          onClick={() => setActiveTab('customRules')}
        >
          Custom Rules
        </Button>
      </div>

      {activeTab === 'environments' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Environment Targeting</h3>
          <div className="space-y-2">
            {['development', 'testing', 'staging', 'production'].map(env => (
              <div key={env} className="flex items-center space-x-2">
                <Switch
                  checked={(conditions.environments || []).includes(env)}
                  onCheckedChange={(checked) => {
                    const environments = new Set(conditions.environments || []);
                    if (checked) {
                      environments.add(env);
                    } else {
                      environments.delete(env);
                    }
                    updateConditions('environments', Array.from(environments));
                  }}
                />
                <span className="capitalize">{env}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'userGroups' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">User Group Targeting</h3>
          <div className="space-y-4">
            {(conditions.userGroups || []).map((group, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Group ID"
                  value={group.groupId}
                  onChange={(e) => {
                    const userGroups = [...(conditions.userGroups || [])];
                    userGroups[index] = { ...group, groupId: e.target.value };
                    updateConditions('userGroups', userGroups);
                  }}
                />
                <Input
                  placeholder="Group Name"
                  value={group.name}
                  onChange={(e) => {
                    const userGroups = [...(conditions.userGroups || [])];
                    userGroups[index] = { ...group, name: e.target.value };
                    updateConditions('userGroups', userGroups);
                  }}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    const userGroups = [...(conditions.userGroups || [])];
                    userGroups.splice(index, 1);
                    updateConditions('userGroups', userGroups);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                const userGroups = [...(conditions.userGroups || [])];
                userGroups.push({ groupId: '', name: '' });
                updateConditions('userGroups', userGroups);
              }}
            >
              Add Group
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'percentage' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Percentage Rollout</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Percentage (0-100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={conditions.percentage?.value || 0}
                onChange={(e) => {
                  updateConditions('percentage', {
                    ...(conditions.percentage || {}),
                    value: Number(e.target.value)
                  });
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={conditions.percentage?.sticky || false}
                onCheckedChange={(checked) => {
                  updateConditions('percentage', {
                    ...(conditions.percentage || {}),
                    sticky: checked
                  });
                }}
              />
              <span>Sticky (consistent per user)</span>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'dateRange' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Date Range</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <DatePicker
                value={conditions.dateRange?.startDate ? new Date(conditions.dateRange.startDate) : null}
                onChange={(date) => {
                  updateConditions('dateRange', {
                    ...(conditions.dateRange || {}),
                    startDate: date
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <DatePicker
                value={conditions.dateRange?.endDate ? new Date(conditions.dateRange.endDate) : null}
                onChange={(date) => {
                  updateConditions('dateRange', {
                    ...(conditions.dateRange || {}),
                    endDate: date
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Timezone</label>
              <Select
                value={conditions.dateRange?.timezone || 'UTC'}
                onChange={(value) => {
                  updateConditions('dateRange', {
                    ...(conditions.dateRange || {}),
                    timezone: value
                  });
                }}
                options={[
                  { label: 'UTC', value: 'UTC' },
                  { label: 'Local', value: 'local' },
                  // Add more timezone options as needed
                ]}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'deviceTypes' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Device Type Targeting</h3>
          <div className="space-y-2">
            {['desktop', 'mobile', 'tablet'].map(devic(e: any) => (
              <div key={device} className="flex items-center space-x-2">
                <Switch
                  checked={(conditions.deviceTypes || []).includes(device)}
                  onCheckedChange={(checked) => {
                    const deviceTypes = new Set(conditions.deviceTypes || []);
                    if (checked) {
                      deviceTypes.add(device);
                    } else {
                      deviceTypes.delete(device);
                    }
                    updateConditions('deviceTypes', Array.from(deviceTypes));
                  }}
                />
                <span className="capitalize">{device}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'customRules' && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Custom Rules</h3>
          <div className="space-y-4">
            {(conditions.customRules || []).map((rule, index) => (
              <div key={index} className="space-y-2">
                <Input
                  placeholder="Rule Name"
                  value={rule.name}
                  onChange={(e) => {
                    const customRules = [...(conditions.customRules || [])];
                    customRules[index] = { ...rule, name: e.target.value };
                    updateConditions('customRules', customRules);
                  }}
                />
                <div className="h-[200px] border rounded">
                  <MonacoEditor
                    language="javascript"
                    value={rule.condition}
                    onChange={(value) => {
                      const customRules = [...(conditions.customRules || [])];
                      customRules[index] = { ...rule, condition: value };
                      updateConditions('customRules', customRules);
                    }}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'off',
                      fontSize: 12,
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const customRules = [...(conditions.customRules || [])];
                    customRules.splice(index, 1);
                    updateConditions('customRules', customRules);
                  }}
                >
                  Remove Rule
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                const customRules = [...(conditions.customRules || [])];
                customRules.push({
                  name: '',
                  condition: '// Return true to enable the feature\nreturn true;'
                });
                updateConditions('customRules', customRules);
              }}
            >
              Add Custom Rule
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}