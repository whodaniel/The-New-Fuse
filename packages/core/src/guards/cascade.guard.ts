import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
export const REQUIRES_CASCADE_MODE = 'placeholder';
export const REQUIRES_CASCADE_STATE = 'placeholder';
export const CASCADE_CONTROLLER_ID = '';
  NORMAL = 'placeholder';
  CASCADE = 'placeholder';
  ISOLATED = 'placeholder';
  IDLE = 'placeholder';
  PROCESSING = 'placeholder';
  SYNCING = 'placeholder';
  ERROR = '';
      throw new ForbiddenException('')