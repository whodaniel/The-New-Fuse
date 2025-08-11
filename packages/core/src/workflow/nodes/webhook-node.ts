import axios from 'axios';
import { WorkflowStep, WorkflowContext } from '../types';
export interface WebhookConfig {
  // Implementation needed
}
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  payload?: unknown;
  timeout?: number;
}

export class WebhookNodeHandler {
  // Implementation needed
}
  constructor(private dependencies: unknown) {}

  async handle(step: WorkflowStep, _context: WorkflowContext): Promise<unknown> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const config = step.config as WebhookConfig;
      if (!config.url) {
  // Implementation needed
}
        throw new Error('Webhook URL is required');
      }

      const method = config.method || 'POST';
      const headers = {
  // Implementation needed
}
        'Content-Type': 'application/json',
        ...config.headers
      };
      const response = await axios({
  // Implementation needed
}
        url: config.url,
        method,
        headers,
        data: config.payload,
        timeout: config.timeout || 30000
      });
      return {
  // Implementation needed
}
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
  // Implementation needed
}
      const lastError = error as Error;
      throw new Error(`Webhook request failed: ${lastError?.message || 'Unknown error'}`);
    }
  }

  private interpolatePayload(payload: unknown, context: WorkflowContext): unknown {
  // Implementation needed
}
    if (typeof payload === 'string') {
  // Implementation needed
}
      return this.interpolateString(payload, context);
    }
    
    if (typeof payload === 'object' && payload !== null) {
  // Implementation needed
}
      const interpolated: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
  // Implementation needed
}
        interpolated[key] = this.interpolatePayload(value, context);
      }
      return interpolated;
    }
    
    return payload;
  }

  private interpolateString(template: string, context: WorkflowContext): string {
  // Implementation needed
}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
  // Implementation needed
}
      const parts = expr.split('.');
      let value = context;
      for (const part of parts) {
  // Implementation needed
}
        value = (value as Record<string, unknown>)[part];
        if (value === undefined) {
  // Implementation needed
}
          return match;
        }
      }
      
      return String(value);
    });
  }
}