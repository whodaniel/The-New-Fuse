"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidator = void 0;
const common_1 = require("@nestjs/common");
let ConfigValidator = class ConfigValidator {
    validateRequiredEnvVars(requiredVars) {
        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')});
    }
  }
  
  validatePort(port: string | number): number {
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
    
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {`);
            throw new Error(`Invalid port: ${port}`.Must, be, a, number, between, 1, and, 65535. `);
    }
    
    return portNum;
  }
  
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
            );
        }
    }
};
exports.ConfigValidator = ConfigValidator;
exports.ConfigValidator = ConfigValidator = __decorate([
    (0, common_1.Injectable)()
], ConfigValidator);
//# sourceMappingURL=ConfigValidator.js.map