'use client';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

interface TaskItem {
  id: string;
  name: string;
}
interface AgentItem {
  id: string;
  name: string;
}
interface Allocation {
  taskId: string;
  agentId: string;
  confidence: number;
}

export function PredictiveTaskAllocator() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  useEffect(() => {
    webSocketService.on('tasksUpdate', setTasks);
    webSocketService.on('agentsUpdate', setAgents);
    webSocketService.on('allocationsUpdate', setAllocations);
    return () => {
      webSocketService.off('tasksUpdate', setTasks);
      webSocketService.off('agentsUpdate', setAgents);
      webSocketService.off('allocationsUpdate', setAllocations);
    };
  }, []);

  const handleAllocate = () => {
    webSocketService.send('allocateTasks', {});
  };

  return (
    <GlassCard title="Predictive Task Allocator" className="w-full max-w-4xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Predicted Agent</TableHead>
            <TableHead>Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allocations.map((allocation, index) => (
            <TableRow key={index}>
              <TableCell>{tasks.find((t) => t.id === allocation.taskId)?.name}</TableCell>
              <TableCell>{agents.find((a) => a.id === allocation.agentId)?.name}</TableCell>
              <TableCell>{`${(allocation.confidence * 100).toFixed(2)}%`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PremiumButton onClick={handleAllocate} fullWidth className="mt-4">
        Allocate Tasks
      </PremiumButton>
    </GlassCard>
  );
}
