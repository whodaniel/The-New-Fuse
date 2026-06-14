"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
// @ts-ignore
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const community_api_key_guard_1 = require("../../guards/community-api-key.guard");
const billing_controller_1 = require("./billing.controller");
const paypal_controller_1 = require("./paypal.controller");
const paypal_service_1 = require("./paypal.service");
const stripe_controller_1 = require("./stripe.controller");
const stripe_service_1 = require("./stripe.service");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, drizzle_1.DrizzleModule],
        controllers: [billing_controller_1.BillingController, paypal_controller_1.PayPalController, stripe_controller_1.StripeController],
        providers: [paypal_service_1.PayPalService, stripe_service_1.StripeService, community_api_key_guard_1.CommunityApiKeyGuard],
        exports: [paypal_service_1.PayPalService, stripe_service_1.StripeService],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map