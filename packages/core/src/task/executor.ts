import { /* TODO: specify imports */ } from /@nestjs/common/;
  privatereadonlyretryDelay: number;
  private readonly executors: Map<string, Function> =newMap();
  private isRunning:boolean= 'placeholder';
    // Update task status'
   this.eventEmitter.emit('event', data);