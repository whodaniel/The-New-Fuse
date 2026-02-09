export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  change?: {
    value: number;
    trend: up' | 'down' | 'neutral';
    period: string;
  };
  icon?: (React as any).ReactNode;
  color?: blue' | 'green' | 'yellow' | 'red' | 'indigo' | 'purple';
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
  type: metric' | 'chart' | 'list' | 'custom';
  title: string;
  description?: string;
  size: small' | 'medium' | 'large';
  data: DashboardMetric | ChartData | any;
  loading?: boolean;
  error?: string;
  refreshInterval?: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Array<{
    id: string;
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  }>;
}

export interface DashboardContextType {
  layouts: DashboardLayout[];
  currentLayout: string;
  widgets: DashboardWidget[];
  setCurrentLayout: (id: string) => void;
  updateWidget: (id: string, data: Partial<DashboardWidget>) => void;
  updateLayout: (layout: DashboardLayout) => void;
  refreshWidget: (id: string) => Promise<void>;
}
