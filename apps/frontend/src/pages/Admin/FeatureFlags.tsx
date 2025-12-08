import React from 'react';
import { Card } from '@/components/ui/design-system';
import { Flag } from 'lucide-react';

const FeatureFlags = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <Card className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      <div className="rounded-full bg-blue-50 p-6 mb-6">
        <Flag className="h-12 w-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Feature Flags</h2>
      <p className="text-gray-500 max-w-md">
        Feature flag management is coming soon. Control experimental features and rollouts from this dashboard.
      </p>
    </Card>
  </div>
);

export default FeatureFlags;
