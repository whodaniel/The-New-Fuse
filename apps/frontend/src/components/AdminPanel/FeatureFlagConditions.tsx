// @ts-nocheck
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
// Temporarily using local components instead of ui-consolidated
// import { Card, Input, Switch, Button, DatePicker, Select } from '@the-new-fuse/ui-consolidated';
import { FeatureFlagConditions } from '@the-new-fuse/types/featureFlags';
// import { MonacoEditor } from '@the-new-fuse/ui-consolidated';

// Temporary placeholder components
const DatePicker = ({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) => (
  <input
    type="date"
    value={value ? value.toISOString().split('T')[0] : ''}
    onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
    className="px-3 py-2 border border-white/10 bg-black/20 rounded-md text-white"
  />
);

const Select = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-2 border border-white/10 bg-black/20 rounded-md text-white"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value} className="bg-slate-800">
        {option.label}
      </option>
    ))}
  </select>
);

interface FeatureFlagConditionsEditorProps {
  conditions: FeatureFlagConditions;
  onChange: (conditions: FeatureFlagConditions) => void;
}

export function FeatureFlagConditionsEditor({
  conditions,
  onChange,
}: FeatureFlagConditionsEditorProps) {
  const [activeTab, setActiveTab] = useState('environments');

  const updateConditions = (key: string, value: any) => {
    onChange({
      ...conditions,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeTab === 'environments' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('environments')}
        >
          Environments
        </Button>
        <Button
          variant={activeTab === 'userGroups' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('userGroups')}
        >
          User Groups
        </Button>
        <Button
          variant={activeTab === 'percentage' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('percentage')}
        >
          Percentage
        </Button>
        <Button
          variant={activeTab === 'dateRange' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('dateRange')}
        >
          Date Range
        </Button>
        <Button
          variant={activeTab === 'deviceTypes' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('deviceTypes')}
        >
          Device Types
        </Button>
        <Button
          variant={activeTab === 'customRules' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('customRules')}
        >
          Custom Rules
        </Button>
      </div>

      {activeTab === 'environments' && (
        <Card title="Environment Targeting" gradient="blue">
          <div className="space-y-2">
            {['development', 'testing', 'staging', 'production'].map((env) => (
              <div key={env} className="flex items-center space-x-2">
                <Switch
                  checked={(conditions.environments || []).includes(env)}
                  onCheckedChange={(checked) => {
                    const envs = [...(conditions.environments || [])];
                    if (checked) {
                      envs.push(env);
                    } else {
                      const index = envs.indexOf(env);
                      if (index > -1) envs.splice(index, 1);
                    }
                    updateConditions('environments', envs);
                  }}
                />
                <span className="capitalize text-white">{env}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'userGroups' && (
        <Card title="User Group Targeting" gradient="purple">
          <div className="space-y-4">
            <div className="space-y-2">
              {['admin', 'beta-testers', 'internal', 'early-adopters'].map((group) => (
                <div key={group} className="flex items-center space-x-2">
                  <Switch
                    checked={(conditions.userGroups || []).includes(group)}
                    onCheckedChange={(checked) => {
                      const groups = [...(conditions.userGroups || [])];
                      if (checked) {
                        groups.push(group);
                      } else {
                        const index = groups.indexOf(group);
                        if (index > -1) groups.splice(index, 1);
                      }
                      updateConditions('userGroups', groups);
                    }}
                  />
                  <span className="capitalize text-white">{group.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm font-medium mb-2 text-white">
                Specific User IDs (comma separated)
              </p>
              <Input
                placeholder="user-123, user-456"
                value={(conditions.userIds || []).join(', ')}
                onChange={(e) =>
                  updateConditions(
                    'userIds',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'percentage' && (
        <Card title="Rollout Percentage" gradient="cyan">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                min="0"
                max="100"
                className="w-24"
                value={conditions.rolloutPercentage || 0}
                onChange={(e) => updateConditions('rolloutPercentage', parseInt(e.target.value))}
              />
              <span className="text-white">% of users</span>
            </div>
            <p className="text-sm text-gray-400">
              Gradually roll out this feature to a percentage of your user base.
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'dateRange' && (
        <Card title="Active Date Range" gradient="green">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Start Date</label>
              <DatePicker
                value={conditions.startDate ? new Date(conditions.startDate) : null}
                onChange={(date) => updateConditions('startDate', date ? date.toISOString() : null)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">End Date</label>
              <DatePicker
                value={conditions.endDate ? new Date(conditions.endDate) : null}
                onChange={(date) => updateConditions('endDate', date ? date.toISOString() : null)}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'deviceTypes' && (
        <Card title="Device Type Targeting" gradient="orange">
          <div className="space-y-2">
            {['desktop', 'mobile', 'tablet', 'ios', 'android'].map((device) => (
              <div key={device} className="flex items-center space-x-2">
                <Switch
                  checked={(conditions.deviceTypes || []).includes(device)}
                  onCheckedChange={(checked) => {
                    const devices = [...(conditions.deviceTypes || [])];
                    if (checked) {
                      devices.push(device);
                    } else {
                      const index = devices.indexOf(device);
                      if (index > -1) devices.splice(index, 1);
                    }
                    updateConditions('deviceTypes', devices);
                  }}
                />
                <span className="capitalize text-white">{device}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'customRules' && (
        <Card title="Custom Targeting Rules" gradient="pink">
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Define complex targeting rules using JSON logic or custom predicates.
            </p>
            <div className="p-4 rounded-md bg-black/40 border border-white/10">
              <pre className="text-xs text-cyan-400">
                {JSON.stringify(conditions.customRules || {}, null, 2)}
              </pre>
            </div>
            <Button variant="outline" size="sm">
              Edit Custom Rules
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
