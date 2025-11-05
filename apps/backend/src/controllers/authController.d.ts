import { Request, Response } from 'express';
export declare const googleAuth: any;
export declare const googleAuthCallback: any[];
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCurrentUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const authController: {
    register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    googleAuth: any;
    googleAuthCallback: any[];
};
//# sourceMappingURL=authController.d.ts.map