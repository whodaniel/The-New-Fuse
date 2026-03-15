import { Badge, Card, StatCard } from '@/components/ui/design-system';
import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLock, FiShield } from 'react-icons/fi';

/**
 * Security Dashboard - Displays security status and metrics
 */
const SecurityDashboard: React.FC = () => {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage platform security</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <StatCard
            title="System Status"
            value="Secure"
            icon={<FiShield className="h-6 w-6" />}
            color="success"
          />

          <StatCard
            title="Encryption"
            value="256-bit"
            icon={<FiLock className="h-6 w-6" />}
            color="primary"
          />

          <StatCard
            title="Active Threats"
            value={0}
            icon={<FiAlertTriangle className="h-6 w-6" />}
            color="warning"
          />

          <StatCard
            title="Compliance"
            value="100%"
            icon={<FiCheckCircle className="h-6 w-6" />}
            color="success"
          />
        </div>

        <Card className="w-full p-4">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Security Overview</h2>
            <p className="text-muted-foreground">
              All systems are operating normally. No security incidents detected in the last 24
              hours.
            </p>
            <div className="flex gap-2">
              <Badge variant="success">All Clear</Badge>
              <Badge variant="primary">Monitoring Active</Badge>
              <Badge variant="secondary">Firewall Enabled</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SecurityDashboard;
