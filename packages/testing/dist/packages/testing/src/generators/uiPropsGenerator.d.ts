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
export declare const generateButtonProps: (options?: GenerateComponentPropsOptions) => CommonProps & {
    variant: string;
    size: string;
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    children?: string;
};
export declare const generateCardProps: (options?: GenerateComponentPropsOptions) => CommonProps & {
    title: string;
    subtitle?: string;
    elevation?: number;
    children?: React.ReactNode;
};
export declare const generateFormProps: (options?: GenerateComponentPropsOptions) => CommonProps & {
    initialValues: Record<string, any>;
    onSubmit?: (values: any) => void;
    validate?: (values: any) => Record<string, string>;
};
export declare const generateListProps: (data?: any[]) => CommonProps & {
    items: any[];
    renderItem?: (item: any) => React.ReactNode;
    keyExtractor?: (item: any) => string;
    onItemClick?: (item: any) => void;
};
export declare const generateModalProps: (options?: GenerateComponentPropsOptions) => CommonProps & {
    isOpen: boolean;
    title: string;
    onClose?: () => void;
    children?: React.ReactNode;
    size?: "small" | "medium" | "large";
};
export declare const generateTableProps: (data?: any[]) => CommonProps & {
    columns: Array<{
        id: string;
        header: string;
        accessor: string;
        sortable?: boolean;
    }>;
    data: any[];
    onSort?: (column: string) => void;
    onRowClick?: (row: any) => void;
};
export {};
//# sourceMappingURL=uiPropsGenerator.d.ts.map