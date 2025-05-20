import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly configService?;
  private client;
  private pubClient;
  subClient: Redis;
  constructor(configService?: ConfigService);
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<"OK">;
  setex(key: string, ttl: number, value: string): Promise<"OK">;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  flushall(): Promise<"OK">;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<void>;
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
}
