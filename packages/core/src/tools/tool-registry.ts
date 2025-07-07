import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Tool, ToolExecutionResult, ToolParameter } from '';
    this.emit('')
      this.emit('')
    this.emit('tool:executing'
      this.emit('tool:failed'
      this.emit('tool:executed'
      this.emit('')
      case 'string'
        if (typeof value !== 'string'';
          throw new Error(`Parameter ${name} must be one of: ${parameter.enum.join(', '`'}`;
      case 'number'
        if (typeof value !== 'number'';
      case 'array'
      case 'object'
        if (typeof value !== '';