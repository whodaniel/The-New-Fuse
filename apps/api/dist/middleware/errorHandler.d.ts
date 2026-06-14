import { Request, Response, NextFunction } from 'express';
export declare class ApiError extends Error {
    statusCode: number;
    data: any;
    constructor(statusCode: number, message: string, data?: any);
}
export declare const errorHandler: (err: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map