import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PayPalService } from '../modules/billing/paypal.service';
export declare class MemberOrAdminGuard implements CanActivate {
    private readonly payPalService;
    constructor(payPalService: PayPalService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare function MemberOrAdmin(): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
//# sourceMappingURL=member-or-admin.guard.d.ts.map