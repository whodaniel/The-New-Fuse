import { Injectable } from '@nestjs/common';

export interface ComponentAnalysisEvent {
  componentId: string;
  analysisType: string;
  result: any;
  timestamp: Date;
}

@Injectable()
export class ComponentAnalysisSubscriber {
  private subscribers: Map<string, ((event: ComponentAnalysisEvent) => void)[]> = new Map();

  subscribe(componentId: string, callback: (event: ComponentAnalysisEvent) => void): void {
    if (!this.subscribers.has(componentId)) {
      this.subscribers.set(componentId, []);
    }
    this.subscribers.get(componentId)!.push(callback);
  }

  unsubscribe(componentId: string, callback: (event: ComponentAnalysisEvent) => void): void {
    const callbacks = this.subscribers.get(componentId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notify(event: ComponentAnalysisEvent): void {
    const callbacks = this.subscribers.get(event.componentId);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }
}
