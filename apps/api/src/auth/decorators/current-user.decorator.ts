import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type CurrentUserRecord = Record<string, unknown> & { id?: string; sub?: string };

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const rawUser = request?.user as CurrentUserRecord | undefined;
  if (!rawUser || typeof rawUser !== 'object') {
    return rawUser;
  }

  const normalizedUser: CurrentUserRecord =
    !rawUser.id && typeof rawUser.sub === 'string' ? { ...rawUser, id: rawUser.sub } : rawUser;

  if (typeof data === 'string' && data.length > 0) {
    if (Object.prototype.hasOwnProperty.call(normalizedUser, data)) {
      return normalizedUser[data];
    }
    if (data === 'id' && typeof normalizedUser.sub === 'string') {
      return normalizedUser.sub;
    }
    return undefined;
  }

  return normalizedUser;
});

export const User = CurrentUser;
