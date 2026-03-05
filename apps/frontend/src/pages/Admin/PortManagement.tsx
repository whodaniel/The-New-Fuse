// @ts-nocheck
import { Button, Input } from '@/components/core';
import Loading from '@/components/Loading';
import { useEffect, useState } from 'react';

interface PortRegistration {
  id: string;
  serviceName: string;
  port: number;
  status: string;
  environment: string;
}

export default function PortManagement() {
  const [ports, setPorts] = useState<PortRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignValues, setReassignValues] = useState<Record<string, number>>({});

  const fetchPorts = () => {
    setLoading(true);
    fetch('/api/ports')
      .then((res) => res.json())
      .then((data: PortRegistration[]) => setPorts(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  const handleReassign = (id: string) => {
    const newPort = reassignValues[id];
    if (!newPort) return;
    fetch(`/api/ports/${id}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: newPort }),
    }).then(() => fetchPorts());
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Port Management</h2>
      <table className="min-w-full table-auto border-collapse mb-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Service</th>
            <th className="border px-2 py-1">Environment</th>
            <th className="border px-2 py-1">Port</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Reassign</th>
          </tr>
        </thead>
        <tbody>
          {ports.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.serviceName}</td>
              <td className="border px-2 py-1">{p.environment}</td>
              <td className="border px-2 py-1">{p.port}</td>
              <td className="border px-2 py-1">{p.status}</td>
              <td className="border px-2 py-1 flex items-center space-x-2">
                <Input
                  type="number"
                  className="w-20"
                  value={reassignValues[p.id] || ''}
                  onChange={(e) =>
                    setReassignValues({ ...reassignValues, [p.id]: parseInt(e.target.value, 10) })
                  }
                  placeholder="New port"
                />
                <Button size="sm" onClick={() => handleReassign(p.id)}>
                  Reassign
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
