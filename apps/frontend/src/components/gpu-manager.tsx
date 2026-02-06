'use strict';
'use client';
Object.defineProperty(exports, '__esModule', { value: true });
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import table_1 from '@/components/ui/table';
import react_1 from 'react';
import websocket_1 from '../services/websocket';
export function GPUManager() {
  const [gpus, setGPUs] = (0, react_1.useState)([]);
  (0, react_1.useEffect)(() => {
    websocket_1.webSocketService.send('getAvailableGPUs', {});
    websocket_1.webSocketService.on('gpuListUpdate', setGPUs);
    return () => {
      websocket_1.webSocketService.off('gpuListUpdate', () => {});
    };
  }, []);
  const handleRentGPU = (gpuId) => {
    websocket_1.webSocketService.send('rentGPU', { gpuId });
  };
  return (
    <card_1.Card className="w-full max-w-2xl">
      <card_1.CardHeader>
        <card_1.CardTitle>GPU Manager</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        <table_1.Table>
          <table_1.TableHeader>
            <table_1.TableRow>
              <table_1.TableHead>GPU Model</table_1.TableHead>
              <table_1.TableHead>VRAM</table_1.TableHead>
              <table_1.TableHead>Status</table_1.TableHead>
              <table_1.TableHead>Action</table_1.TableHead>
            </table_1.TableRow>
          </table_1.TableHeader>
          <table_1.TableBody>
            {gpus.map((gpu) => (
              <table_1.TableRow key={gpu.id}>
                <table_1.TableCell>{gpu.model}</table_1.TableCell>
                <table_1.TableCell>{gpu.vram} GB</table_1.TableCell>
                <table_1.TableCell>{gpu.status}</table_1.TableCell>
                <table_1.TableCell>
                  <button_1.Button
                    onClick={() => handleRentGPU(gpu.id)}
                    disabled={gpu.status !== 'available'}
                  >
                    Rent
                  </button_1.Button>
                </table_1.TableCell>
              </table_1.TableRow>
            ))}
          </table_1.TableBody>
        </table_1.Table>
      </card_1.CardContent>
    </card_1.Card>
  );
}
