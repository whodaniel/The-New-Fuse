import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { DrizzleClient } from "@the-new-fuse/database";
export declare class DatabaseService extends DrizzleClient implements OnModuleInit, OnModuleDestroy {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=database.service.d.ts.map