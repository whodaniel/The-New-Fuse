import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
export const REQUIRES_CASCADE_MODE = 'requiresCascadeMode'';
export const REQUIRES_CASCADE_STATE = 'requiresCascadeState'';
export const CASCADE_CONTROLLER_ID = '';
  NORMAL = 'normal'';
  CASCADE = 'cascade'';
  ISOLATED = 'isolated'';
  IDLE = 'idle'';
  PROCESSING = 'processing'';
  SYNCING = 'syncing'';
  ERROR = '';
      throw new ForbiddenException('')