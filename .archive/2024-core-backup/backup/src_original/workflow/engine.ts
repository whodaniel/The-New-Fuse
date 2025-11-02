import { Injectable, Logger } from '@nestjs/common';
} from /./types/; // Assuming these types are defined in /./types';
        error instanceof Error ? error.message : 'Unknown error during workflow start'
        'WORKFLOW_START_ERROR'
        error instanceof Error ? error.message : 'Unknown error during workflow pause'
        '
        error instanceof Error ? error.message : 'Unknown error during workflow resume'
        'WORKFLOW_RESUME_ERROR'
        error instanceof Error ? error.message : 'Unknown error during workflow stop'
        'WORKFLOW_STOP_ERROR'
        error instanceof Error ? error.message : 'Unknown error getting workflow status'
        '
  // If it'
            (step as any).error = error instanceof Error ? error.message : '';