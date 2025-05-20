import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/core/CoreModule.js';
import { Metrics } from '../components/ui/UIModule.js';
import { api } from '../lib/api.js';
import { useToast } from '../hooks/useToast.js';

// Schemas for form validation
const agentSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  type: z.enum(['chat', 'task', 'assistant']),
  capabilities: z.array(z.string()),
  settings: z.record(z.any())
});

const trainingSchema = z.object({
  datasetUrl: z.string().url(),
  epochs: z.number().min(1).max(100),
  batchSize: z.number().min(1).max(128),
  learningRate: z.number().min(0.0001).max(0.1)
});

const optimizationSchema = z.object({
  metric: z.enum(['accuracy', 'latency', 'memory']),
  target: z.number(),
  constraints: z.array(z.string())
});

// Types
type AgentFormData = z.infer<typeof agentSchema>;
type TrainingFormData = z.infer<typeof trainingSchema>;
type OptimizationFormData = z.infer<typeof optimizationSchema>;

// Agent Creation Form
interface AgentCreationFormProps {
  onSubmit: (data: AgentFormData) => Promise<void>;
}

export const AgentCreationForm = React.forwardRef<HTMLFormElement, AgentCreationFormProps>(
  ({ onSubmit }, ref) => {
    const { register, handleSubmit, formState: { errors } } = useForm<AgentFormData>({
      resolver: zodResolver(agentSchema)
    });
    
    const { toast } = useToast();
    
    const handleFormSubmit = async (data: AgentFormData): Promise<void> => {
      try {
        await onSubmit(data);
        toast.success('Agent created successfully');
      } catch (error) {
        toast.error('Failed to create agent');
      }
    };
    
    return (
      <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            {...register('description')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            {...register('type')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="chat">Chat</option>
            <option value="task">Task</option>
            <option value="assistant">Assistant</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>
        
        <Button type="submit">Create Agent</Button>
      </form>
    );
  }
);

AgentCreationForm.displayName = 'AgentCreationForm';

// Agent Training Component
interface AgentTrainingProps {
  agentId: string;
  onTrainingComplete: () => void;
}

export const AgentTraining = React.forwardRef<HTMLDivElement, AgentTrainingProps>(
  ({ agentId, onTrainingComplete }, ref) => {
    const { register, handleSubmit, formState: { errors } } = useForm<TrainingFormData>({
      resolver: zodResolver(trainingSchema)
    });
    
    const { toast } = useToast();
    const [progress, setProgress] = React.useState(0);
    
    const handleTraining = async (data: TrainingFormData): Promise<void> => {
      try {
        // Simulate training progress
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 1000);
        
        await api.post(`/agents/${agentId}/train`, data);
        onTrainingComplete();
        toast.success('Training completed successfully');
      } catch (error) {
        toast.error('Training failed');
      }
    };
    
    return (
      <div ref={ref} className="space-y-6">
        <form onSubmit={handleSubmit(handleTraining)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Dataset URL</label>
            <input
              {...register('datasetUrl')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.datasetUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.datasetUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Epochs</label>
              <input
                type="number"
                {...register('epochs', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Batch Size</label>
              <input
                type="number"
                {...register('batchSize', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Learning Rate</label>
              <input
                type="number"
                step="0.0001"
                {...register('learningRate', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <Button type="submit">Start Training</Button>
        </form>

        {progress > 0 && (
          <div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-primary text-primary-foreground">
                    Training Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/20">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AgentTraining.displayName = 'AgentTraining';

// Agent Optimization Component
interface AgentOptimizationProps {
  agentId: string;
  onOptimizationComplete: () => void;
}

export const AgentOptimization = React.forwardRef<HTMLDivElement, AgentOptimizationProps>(
  ({ agentId, onOptimizationComplete }, ref) => {
    const { register, handleSubmit, formState: { errors } } = useForm<OptimizationFormData>({
      resolver: zodResolver(optimizationSchema)
    });
    
    const { toast } = useToast();
    const [optimizing, setOptimizing] = React.useState(false);
    
    const handleOptimization = async (data: OptimizationFormData): Promise<void> => {
      try {
        setOptimizing(true);
        await api.post(`/agents/${agentId}/optimize`, data);
        onOptimizationComplete();
        toast.success('Optimization completed successfully');
      } catch (error) {
        toast.error('Optimization failed');
      } finally {
        setOptimizing(false);
      }
    };
    
    return (
      <div ref={ref} className="space-y-6">
        <form onSubmit={handleSubmit(handleOptimization)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Optimization Metric</label>
            <select
              {...register('metric')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="accuracy">Accuracy</option>
              <option value="latency">Latency</option>
              <option value="memory">Memory Usage</option>
            </select>
            {errors.metric && (
              <p className="mt-1 text-sm text-red-600">{errors.metric.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium">Target Value</label>
            <input
              type="number"
              {...register('target', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.target && (
              <p className="mt-1 text-sm text-red-600">{errors.target.message}</p>
            )}
          </div>
          
          <Button type="submit" disabled={optimizing}>
            {optimizing ? 'Optimizing...' : 'Start Optimization'}
          </Button>
        </form>
      </div>
    );
  }
);

AgentOptimization.displayName = 'AgentOptimization';

// Agent Metrics Display Component
interface AgentMetricsDisplayProps {
  agentId: string;
  refreshInterval?: number;
}

interface MetricsData {
  accuracy: number;
  latency: number;
  requests: number;
  uptime: number;
}

export const AgentMetricsDisplay = React.forwardRef<HTMLDivElement, AgentMetricsDisplayProps>(
  ({ agentId, refreshInterval = 5000 }, ref) => {
    const [metrics, setMetrics] = React.useState<MetricsData | null>(null);
    
    React.useEffect(() => {
      const fetchMetrics = async () => {
        try {
          const data = await api.get(`/agents/${agentId}/metrics`);
          setMetrics(data);
        } catch (error) {
          console.error('Failed to fetch metrics:', error);
        }
      };
      
      fetchMetrics();
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }, [agentId, refreshInterval]);
    
    if (!metrics) {
      return <div>Loading metrics...</div>;
    }
    
    const metricsData = [
      {
        label: 'Accuracy',
        value: `${(metrics.accuracy * 100).toFixed(1)}%`,
        trend: 'up',
        change: 2.5,
      },
      {
        label: 'Latency',
        value: `${metrics.latency.toFixed(2)}ms`,
        trend: 'down',
        change: -5.0,
      },
      {
        label: 'Requests',
        value: metrics.requests.toLocaleString(),
        trend: 'up',
        change: 12.3,
      },
      {
        label: 'Uptime',
        value: `${(metrics.uptime * 100).toFixed(1)}%`,
        trend: 'neutral',
        change: 0.1,
      }
    ];
    
    return (
      <div ref={ref}>
        <Metrics metrics={metricsData} />
      </div>
    );
  }
);

AgentMetricsDisplay.displayName = 'AgentMetricsDisplay';
