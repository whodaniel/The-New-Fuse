export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
export interface FilterCondition {
    id: string;
    field: string;
    operator: FilterOperator;
    value: unknown;
    metadata?: {
        displayName?: string;
        type?: text' | 'number' | 'date' | 'boolean' | 'enum';
        options?: Array<{
            label: string;
            value: unknown;
        }>;
    };
}
export interface FilterGroup {
    id: string;
    name: string;
    conditions: FilterCondition[];
    operator: and' | 'or';
    shared?: boolean;
    creator?: {
        id: string;
        name: string;
    };
    createdAt: Date;
    updatedAt?: Date;
}
export interface FilterState {
    groups: FilterGroup[];
    activeFilters: string[];
    globalOperator: and' | 'or';
}
