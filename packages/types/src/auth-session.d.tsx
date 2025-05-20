export interface AuthSession {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiAuthSession extends AuthSession {
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}
export type CreateAuthSessionDto = Pick<AuthSession, 'userId' | 'expiresAt'>;
export type AuthToken = {
    access_token: string;
};
export type JwtPayload = {
    sub: string;
    email: string;
    roles: string[];
};
//# sourceMappingURL=auth-session.d.ts.map