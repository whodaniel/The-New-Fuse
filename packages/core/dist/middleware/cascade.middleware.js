var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CascadeMiddleware_1;
import { Injectable, Logger } from '@nestjs/common';
let CascadeMiddleware = CascadeMiddleware_1 = class CascadeMiddleware {
    constructor() {
        this.logger = new Logger(CascadeMiddleware_1.name);
    }
    use(req, res, next) {
        this.logger.log('Cascade middleware is running...');
        next();
    }
};
CascadeMiddleware = CascadeMiddleware_1 = __decorate([
    Injectable()
], CascadeMiddleware);
export { CascadeMiddleware };
//# sourceMappingURL=cascade.middleware.js.map