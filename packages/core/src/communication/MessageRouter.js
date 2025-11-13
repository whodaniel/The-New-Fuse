"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const events_1 = require("events");
/**
 * Basic Message Router for core communication package
 *
 * This is a simplified router for internal package use.
 * For full-featured routing, use the implementations in mcp-core or other packages.
 */
class MessageRouter extends events_1.EventEmitter {
    debug;
    constructor(options) {
        super();
        this.debug = options?.debug || false;
    }
    /**
     * Initialize the router
     */
    async initialize() {
        this.log('Initializing message router');
        return Promise.resolve();
    }
    /**
     * Route a message (basic implementation)
     */
    async routeMessage(message) {
        this.log(`Routing message of type ${message?.type || 'unknown'});
    this.emit('message', message);
  }
  
  /**
   * Utility method for logging
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data) {`, console.log(`[Router] ${message}`, data));
    }
}
exports.MessageRouter = MessageRouter;
{
    console.log([Router], $, { message } `);
      }
    }
  }
}

export default MessageRouter;
    );
}
//# sourceMappingURL=MessageRouter.js.map