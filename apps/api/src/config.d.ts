export declare const config: {
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    google: {
        clientId: string | undefined;
        clientSecret: string | undefined;
        callbackUrl: string | undefined;
    };
};
