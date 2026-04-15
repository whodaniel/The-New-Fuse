// @ts-nocheck
'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
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

interface GPU {
  id: string;
  model: string;
  vram: number;
  status: string;
}

export function GPUManager() {
  const [gpus, setGPUs] = useState<GPU[]>([]);

  useEffect(() => {
    webSocketService.send('getAvailableGPUs', {});
    webSocketService.on('gpuListUpdate', setGPUs);
    return () => {
      webSocketService.off('gpuListUpdate', () => {});
    };
  }, []);

  const handleRentGPU = (gpuId: string) => {
    webSocketService.send('rentGPU', { gpuId });
  };

  return (
    <Card title="GPU Manager" gradient="orange" className="w-full max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">GPU Model</TableHead>
            <TableHead className="text-white">VRAM</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gpus.map((gpu) => (
            <TableRow key={gpu.id}>
              <TableCell className="text-white">{gpu.model}</TableCell>
              <TableCell className="text-white">{gpu.vram} GB</TableCell>
              <TableCell className="text-white">{gpu.status}</TableCell>
              <TableCell>
                <Button
                  onClick={() => handleRentGPU(gpu.id)}
                  disabled={gpu.status !== 'available'}
                  variant="primary"
                  size="sm"
                >
                  Rent
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
