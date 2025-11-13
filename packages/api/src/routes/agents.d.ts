interface User {
    id: string;
    [key: string]: any;
}
declare module 'express-serve-static-core' {
    interface Request {
        user?: User;
    }
}
export {};
//# sourceMappingURL=agents.d.ts.map