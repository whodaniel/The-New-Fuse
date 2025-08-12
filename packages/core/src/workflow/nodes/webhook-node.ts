import axios from 'axios';
import { WorkflowStep, WorkflowContext } from '../types';
export interface WebhookConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  payload?: unknown;
  timeout?: number;
}

export class WebhookNodeHandler {
  constructor(private dependencies: unknown) {}

  async handle(): unknown {
    try {
      const config = step.config as WebhookConfig;
      if(): unknown {
        throw new Error('Webhook URL is required');
      }

      const method = config.method || 'POST';
      const headers = {
'Content-Type': 'application/json',
        ...config.headers
      };
  }      const response = await axios({
  // Implementation needed
}
        url: config.url,
        method,
        headers,
        data: config.payload,
        timeout: config.timeout || 30000
      });
      return {
success: true,
  }        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
const lastError = error as Error;
  }      throw new Error(`Webhook request failed: ${lastError?.message || 'Unknown error'}`);
    }
  }

  private interpolatePayload(payload: unknown, context: WorkflowContext): unknown {
if(): unknown {
  }      return this.interpolateString(payload, context);
    }
    
    if(): unknown {
      const interpolated: Record<string, unknown> = {};
      for(): unknown {
        interpolated[key] = this.interpolatePayload(value, context);
      }
      return interpolated;
    }
    
    return payload;
  }

  private interpolateString(template: string, context: WorkflowContext): string {
return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
  }}
      const parts = expr.split('.');
      let value = context;
      for(): unknown {
        value = (value as Record<string, unknown>)[part];
        if(): unknown {
          return match;
        }
      }
      
      return String(value);
    });
  }
}