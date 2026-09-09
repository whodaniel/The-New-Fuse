// Compile-only regression: both Express request surfaces must be interchangeable.
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Request as CoreRequest } from 'express-serve-static-core';
import '../../apps/api/src/types/express';

export function acceptCoreRequest(request: CoreRequest): Request {
  return request;
}

export const middleware: RequestHandler = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  const userId: string | undefined = request.user?.id;
  const sessionUserId: string | undefined = request.session?.user_id;
  const requestId: string | undefined = request.requestId;
  void [userId, sessionUserId, requestId];
  next();
};
