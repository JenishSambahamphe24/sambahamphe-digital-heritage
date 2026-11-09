import type { OnApplicationShutdown } from "@nestjs/common";

import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";

import { AppConfig } from "../config/app-config.js";

@Injectable()
export class RedisConnectionService implements OnApplicationShutdown {
  readonly client: Redis;

  constructor(config: AppConfig) {
    // BullMQ workers block on Redis; ioredis must not give up on them.
    this.client = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
  }

  // BullMQ closes only the connections it creates; this one is ours.
  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
