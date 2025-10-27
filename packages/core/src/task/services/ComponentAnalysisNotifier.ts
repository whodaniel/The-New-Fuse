import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ComponentAnalysisNotifier {
  private readonly logger = new Logger(ComponentAnalysisNotifier.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  notify(analysis: any) {
    this.logger.log('Notifying component analysis:', analysis);
    this.eventEmitter.emit('component.analysis', analysis);
  }
}
