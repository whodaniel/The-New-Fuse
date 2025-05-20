import { generateId, generateTimestamp, pickRandom } from './utils.js';
import type { GeneratedUser } from './userGenerator.js';
import type { GeneratedWorkflow } from './workflowGenerator.js';

export interface GenerateComponentPropsOptions {
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  withChildren?: boolean;
  withCallbacks?: boolean;
}

type CommonProps = {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
};

export const generateButtonProps = (options: GenerateComponentPropsOptions = {}): CommonProps & {
  variant: string;
  size: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children?: string;
} => ({
  id: generateId(),
  'data-testid': 'button-test',
  variant: options.variant || 'default',
  size: options.size || 'medium',
  disabled: options.disabled,
  loading: options.loading,
  ...(options.withChildren && { children: 'Click me' }),
  ...(options.withCallbacks && { onClick: () => console.log('Button clicked') })
});

export const generateCardProps = (options: GenerateComponentPropsOptions = {}): CommonProps & {
  title: string;
  subtitle?: string;
  elevation?: number;
  children?: React.ReactNode;
} => ({
  id: generateId(),
  'data-testid': 'card-test',
  title: 'Test Card',
  subtitle: options.withChildren ? 'Test Subtitle' : undefined,
  elevation: Math.floor(Math.random() * 5),
  ...(options.withChildren && {
    children: '<div>Card content</div>'
  })
});

export const generateFormProps = (options: GenerateComponentPropsOptions = {}): CommonProps & {
  initialValues: Record<string, any>;
  onSubmit?: (values: any) => void;
  validate?: (values: any) => Record<string, string>;
} => ({
  id: generateId(),
  'data-testid': 'form-test',
  initialValues: {
    username: '',
    email: '',
    password: '',
    remember: false
  },
  ...(options.withCallbacks && {
    onSubmit: (values: any) => console.log('Form submitted:', values),
    validate: (values: any) => {
      const errors: Record<string, string> = {};
      if (!values.email) {
        errors.email = 'Required';
      }
      return errors;
    }
  })
});

export const generateListProps = (data: any[] = []): CommonProps & {
  items: any[];
  renderItem?: (item: any) => React.ReactNode;
  keyExtractor?: (item: any) => string;
  onItemClick?: (item: any) => void;
} => ({
  id: generateId(),
  'data-testid': 'list-test',
  items: data.length > 0 ? data : [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' }
  ],
  renderItem: (item: any) => `<div>${item.title}</div>`,
  keyExtractor: (item: any) => item.id,
  onItemClick: (item: any) => console.log('Item clicked:', item)
});

export const generateModalProps = (options: GenerateComponentPropsOptions = {}): CommonProps & {
  isOpen: boolean;
  title: string;
  onClose?: () => void;
  children?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
} => ({
  id: generateId(),
  'data-testid': 'modal-test',
  isOpen: true,
  title: 'Test Modal',
  size: options.size || 'medium',
  ...(options.withCallbacks && {
    onClose: () => console.log('Modal closed')
  }),
  ...(options.withChildren && {
    children: '<div>Modal content</div>'
  })
});

export const generateTableProps = (data: any[] = []): CommonProps & {
  columns: Array<{
    id: string;
    header: string;
    accessor: string;
    sortable?: boolean;
  }>;
  data: any[];
  onSort?: (column: string) => void;
  onRowClick?: (row: any) => void;
} => ({
  id: generateId(),
  'data-testid': 'table-test',
  columns: [
    { id: 'id', header: 'ID', accessor: 'id', sortable: true },
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'status', header: 'Status', accessor: 'status' }
  ],
  data: data.length > 0 ? data : [
    { id: '1', name: 'Item 1', status: 'active' },
    { id: '2', name: 'Item 2', status: 'inactive' },
    { id: '3', name: 'Item 3', status: 'pending' }
  ],
  onSort: (column: string) => console.log('Sort by:', column),
  onRowClick: (row: any) => console.log('Row clicked:', row)
});