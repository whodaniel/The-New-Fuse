#!/bin/bash
set -e

echo "Creating necessary directories..."
mkdir -p src/types
mkdir -p src/core/database

echo "Creating type definition files..."

# Create component types
cat > src/types/component-types.d.ts << 'EOL'
import { FC, PropsWithChildren, ReactNode } from 'react';

// Common prop types
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface ModuleProps extends BaseProps {
  children?: ReactNode;
  config?: Record<string, unknown>;
}

// Extend FC to include common module patterns
export type ModuleFC<P = {}> = FC<P & ModuleProps>;
EOL

# Create database types
cat > src/core/database/types.ts << 'EOL'
import { BaseEntity } from '@the-new-fuse/types';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface QueryOptions {
  where?: Record<string, unknown>;
  select?: string[];
  relations?: string[];
  order?: Record<string, 'ASC' | 'DESC'>;
  skip?: number;
  take?: number;
}

export interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

export interface Repository<T extends BaseEntity> {
  find(options?: QueryOptions): Promise<T[]>;
  findOne(id: string, options?: QueryOptions): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
EOL

echo "Updating React component imports and declarations..."
# Update imports in all React components
find src/components -type f -name "*.tsx" -exec sed -i'' -e '
  1i\import { ModuleFC, ModuleProps } from "../types/component-types";
' {} \;

# Update React component declarations
find src/components -type f -name "*.tsx" -exec sed -i'' -e '
  s/: FC</: ModuleFC</g;
  s/: React.FC</: ModuleFC</g;
  s/props: {/props: ModuleProps \& {/g;
' {} \;

echo "Running type checking..."
npx tsc --noEmit

echo "TypeScript fixes applied. Please check remaining errors."
