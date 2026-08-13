import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type CurrentUserRecord = Record<string, unknown> & {
  id?: string;
  sub?: string;
  user_id?: string;
  userId?: string;
};

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim();
    if (normalized.length > 0) return normalized;
  }
  return undefined;
}

function resolveCanonicalUserId(user: CurrentUserRecord): string | undefined {
  return firstNonEmptyString(user.id, user.sub, user.user_id, user.userId);
}

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const rawUser = request?.user as CurrentUserRecord | undefined;
  if (!rawUser || typeof rawUser !== 'object') {
    return rawUser;
  }

  const canonicalUserId = resolveCanonicalUserId(rawUser);
  const normalizedUser: CurrentUserRecord =
    !rawUser.id && canonicalUserId ? { ...rawUser, id: canonicalUserId } : rawUser;

  if (typeof data === 'string' && data.length > 0) {
    if (data === 'id') {
      return canonicalUserId;
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUser, data)) {
      return normalizedUser[data];
    }
    return undefined;
  }

  return normalizedUser;
});

export const User = CurrentUser;
