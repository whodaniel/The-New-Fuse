import { EventEmitter } from 'events';
  export enum CascadeMode {
  READ = 'read',
  WRITE = 'write',
}

export enum CascadeState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}