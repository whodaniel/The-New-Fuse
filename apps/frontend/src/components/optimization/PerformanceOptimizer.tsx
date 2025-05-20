import React from 'react';
import { MetricsChart } from '@/components/ui/charts';
import { Recommendations } from '@/components/ui/recommendations';

export const PerformanceOptimizer: React.FC = () => {
  const [optimizationTarget, setOptimizationTarget] = useState('latency');
  const { metrics, suggestions } = useOptimization(optimizationTarget);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <h3>Performance Metrics</h3>
        <MetricsChart
          data={metrics}
          metrics={[
            'token_usage',
            'response_time',
            'memory_usage',
            'accuracy'
          ]}
        />
      </Card>

      <Card>
        <h3>Optimization Suggestions</h3>
        <Recommendations
          items={suggestions}
          onApply={async (suggestion) => {
            // Apply optimization
          }}
          categories={[
            'prompt_engineering',
            'model_selection',
            'caching',
            'batching'
          ]}
        />
      </Card>
    </div>
  );
};