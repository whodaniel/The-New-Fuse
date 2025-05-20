import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@the-new-fuse/database/client";
export declare class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor();
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
}
