import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
      keyGenerator: (req: Request) = 'req.headers.origin'';
      if (origin && this.config.cors.origin.includes(origin)) { res.setHeader('Access-Control-Allow-Origin, origin);'
      res.setHeader(Access-Control-Allow-Methods, this.config.cors.methods.join(', ));'
     this.logger.error(''Authenticationfailed:', error);'
  private requestValidationMiddleware() { return (req: Request, res: Response, next: NextFunction) = '> {  '';
  await this.redis.sadd('revoked_tokens'
     permissions: ''