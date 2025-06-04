export declare class AppController {
    constructor();
    getStatus(): {
        message: string;
        timestamp: string;
        version: string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
}
