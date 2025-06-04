export declare function generateToken(payload: any, expiresIn?: string): string;
export declare function verifyToken(token: string): any;
export declare function authenticateUser(email: string, password: string): Promise<any>;
