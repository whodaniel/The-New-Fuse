export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon?: any;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'indigo' | 'purple';
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description?: string;
  dataSource: string;
  config: Record<string, unknown>;
  layout: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  items: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}
