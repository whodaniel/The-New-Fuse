import React from 'react';

// Import components from their correct paths
import { Layout } from '../layout/BaseLayout.js';
import { Navigation } from '../layout/Navigation.js';
import { Table } from './data-table.js';
import { Chart } from './graph-chart.js';
import { Form } from './form.js';

export {
  Layout,
  Navigation,
  Table,
  Chart,
  Form
}

// Define and re-export types
export interface LayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface NavigationProps {
  items: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
}

export interface TableProps {
  data: any[];
  columns: Array<{
    header: string;
    accessor: string | ((item: any) => React.ReactNode);
  }>;
}

export interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
}

export interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}
