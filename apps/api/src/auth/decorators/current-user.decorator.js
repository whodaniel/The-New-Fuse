import { createParamDecorator } from '@nestjs/common';
export const CurrentUser = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
export const User = CurrentUser;
//# sourceMappingURL=current-user.decorator.js.map