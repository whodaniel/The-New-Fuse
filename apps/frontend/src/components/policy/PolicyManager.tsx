import React from 'react';
import { PolicyEditor } from '@/components/ui/policy-editor';
import { RuleBuilder } from '@/components/ui/rule-builder';

interface Policy {
  id: string;
  name: string;
  rules: PolicyRule[];
  scope: 'global' | 'agent' | 'group';
}

export const PolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <h3>Security Policies</h3>
        <RuleBuilder
          rules={activePolicy?.rules || []}
          conditions={[
            'resource_access',
            'api_calls',
            'data_handling',
            'communication'
          ]}
          actions={[
            'allow',
            'deny',
            'require_approval',
            'log'
          ]}
        />
      </Card>

      <Card>
        <h3>Compliance Settings</h3>
        <PolicyEditor
          policy={activePolicy}
          onChange={(updated) => {
            // Update policy
          }}
          templates={[
            'GDPR',
            'HIPAA',
            'SOC2',
            'Custom'
          ]}
        />
      </Card>
    </div>
  );
};