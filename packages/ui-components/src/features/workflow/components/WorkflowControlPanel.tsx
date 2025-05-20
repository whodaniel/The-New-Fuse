import React, { useState, useEffect } from 'react';
import { WorkflowStep, WorkflowMetrics, WorkflowStatus } from '../types.js';
import { Button } from '../../../core/button/index.js';
import { Progress } from '../../../core/progress/index.js';
import { Badge } from '../../../core/badge.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../../core/card/index.js';
import { Alert, AlertDescription, AlertTitle } from '../../../core/alert/index.js';
import { Play, Pause, RotateCcw, Trash2, AlertCircle } from 'lucide-react';

// Define the StepMetrics type that was missing
interface StepMetrics {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
}

interface WorkflowControlPanelProps {
  workflowId: string;
  status: WorkflowStatus;
  metrics?: WorkflowMetrics;
  onPause: () => void;
  onResume: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

const WorkflowControlPanel: React.FC<WorkflowControlPanelProps> = ({
  workflowId,
  status,
  metrics,
  onPause,
  onResume,
  onRetry,
  onCancel,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate progress based on metrics
    if (metrics?.stepMetrics) {
      const total = Object.keys(metrics.stepMetrics).length || 1;
      const completed = Object.values(metrics.stepMetrics).filter(
        (s: StepMetrics) => s.status === 'completed'
      ).length;
      
      setProgress(Math.round((completed / total) * 100));
    }
  }, [metrics]);

  const getStepMetricsArray = (metrics?: WorkflowMetrics): StepMetrics[] => {
    return metrics?.stepMetrics ? Object.values(metrics.stepMetrics) : [];
  };

  const queuedCount = getStepMetricsArray(metrics).filter((s: StepMetrics) => s.status === 'pending').length;
  const processingCount = getStepMetricsArray(metrics).filter((s: StepMetrics) => s.status === 'running').length;
  const retryCount = getStepMetricsArray(metrics).reduce((acc: number, s: StepMetrics) => acc + (s.attempts > 1 ? s.attempts - 1 : 0), 0);
  const failedSteps = getStepMetricsArray(metrics)
    .filter((s: StepMetrics) => s.status === 'failed')
    .map((s: StepMetrics) => `Step ${s.id} failed after ${s.attempts} attempts`);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Workflow: {workflowId}</span>
          <Badge
            variant={
              status === 'running' ? 'success' :
              status === 'paused' ? 'warning' :
              status === 'completed' ? 'secondary' :
              status === 'failed' ? 'destructive' : 'default'
            }
          >
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-2" showValue />
        <div className="text-sm text-muted-foreground mt-2">
          <span>
            ({queuedCount} queued · {processingCount} processing · {retryCount} retries)
          </span>
        </div>

        {status === 'failed' && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Workflow Errors</AlertTitle>
            <AlertDescription>
              <ul>
                {failedSteps.map((errorMsg, index) => (
                  <li key={index}>{errorMsg}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {status === 'running' ? (
            <Button
              onClick={onPause}
              disabled={status !== 'running'}
              variant="outline"
              className="mr-2"
              startIcon={<Pause className="h-4 w-4 mr-2" />}
            >
              Pause
            </Button>
          ) : (
            <Button
              onClick={onResume}
              variant="outline"
              className="mr-2"
              startIcon={<Play className="h-4 w-4 mr-2" />}
            >
              Resume
            </Button>
          )}
          <Button
            onClick={onRetry}
            disabled={status === 'completed'}
            variant="outline"
            className="mr-2"
            startIcon={<RotateCcw className="h-4 w-4 mr-2" />}
          >
            Retry
          </Button>
        </div>
        <Button
          onClick={onCancel}
          disabled={status === 'completed' || status === 'failed'}
          variant="destructive"
          className="ml-auto"
          startIcon={<Trash2 className="h-4 w-4 mr-2" />}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkflowControlPanel;