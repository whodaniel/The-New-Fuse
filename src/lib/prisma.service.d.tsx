import { PrismaClient } from "@the-new-fuse/database/client";
import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
export declare class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor();
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
}
