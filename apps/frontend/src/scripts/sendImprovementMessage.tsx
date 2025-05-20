import { CascadeBridge } from '../services/CascadeBridge.js';
import { LoggingService } from '../services/logging.js';

interface ImprovementMessage {
  type: 'improvement';
  component: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export async function sendImprovementMessage(
  component: string,
  description: string,
  priority: ImprovementMessage['priority'] = 'medium',
  metadata?: Record<string, any>
): Promise<void> {
  const bridge = CascadeBridge.getInstance();
  const logger = LoggingService.getInstance();

  const message: ImprovementMessage = {
    type: 'improvement',
    component,
    description,
    priority,
    metadata
  };

  try {
    await bridge.send({
      type: 'improvement_suggestion',
      payload: message,
      metadata: {
        timestamp: Date.now(),
        source: 'frontend'
      }
    });

    logger.info('Sent improvement message', { component, priority });
  } catch (error) {
    logger.error('Failed to send improvement message', error as Error, { component, priority });
    throw error;
  }
}
