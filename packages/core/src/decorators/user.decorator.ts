
export {}
exports.User = void 0;
import common_1 from '@nestjs/common';
exports.User = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
});
//# sourceMappingURL=user.decorator.js.mapexport {};
