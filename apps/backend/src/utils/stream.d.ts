import { Response } from 'express';
export declare class StreamResponse {
    private res;
    constructor(res: Response);
    write(data: string | Buffer): void;
    end(): void;
}
//# sourceMappingURL=stream.d.ts.map