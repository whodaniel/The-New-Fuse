export enum Permission {
  // User Management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  
  // System
  VIEW_METRICS = 'view_metrics',
  VIEW_LOGS = 'view_logs',
  MANAGE_SYSTEM = 'manage_system',
  
  // Services
  VIEW_SERVICES = 'view_services',
  MANAGE_SERVICES = 'manage_services',
  
  // Features
  MANAGE_FEATURES = 'manage_features',
  
  // Scripts
  RUN_SCRIPTS = 'run_scripts',
  
  // Database
  VIEW_DATABASE = 'view_database',
  MANAGE_DATABASE = 'manage_database'
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
}
