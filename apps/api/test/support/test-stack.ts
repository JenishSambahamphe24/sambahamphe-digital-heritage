import type { INestApplicationContext } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { StartedRedisContainer } from "@testcontainers/redis";

import { RedisContainer } from "@testcontainers/redis";

import { AppFactory } from "../../src/app.factory.js";
import { WorkerFactory } from "../../src/worker.factory.js";
import { TestDatabase } from "./test-database.js";
import { TestEnv } from "./test-env.js";
import { TestMailbox } from "./test-mailbox.js";

const REDIS_IMAGE = "redis:7.4-alpine";

export class TestStack {
  private constructor(
    readonly database: TestDatabase,
    readonly mailbox: TestMailbox,
    private readonly redis: StartedRedisContainer,
    readonly app: NestExpressApplication,
    private readonly worker: INestApplicationContext,
  ) {}

  static async start(): Promise<TestStack> {
    const [database, mailbox, redis] = await Promise.all([
      TestDatabase.start(),
      TestMailbox.start(),
      new RedisContainer(REDIS_IMAGE).start(),
    ]);
    const env = TestEnv.build({
      DATABASE_URL: database.url,
      REDIS_URL: redis.getConnectionUrl(),
      SMTP_URL: mailbox.smtpUrl,
      // Lets each test present its own client IP via X-Forwarded-For, so
      // per-IP rate limits don't leak between tests.
      TRUST_PROXY_HOPS: "1",
    });
    const app = await AppFactory.create(env);
    await app.init();
    const worker = await WorkerFactory.create(env);
    await worker.init();
    return new TestStack(database, mailbox, redis, app, worker);
  }

  async stop(): Promise<void> {
    await this.worker.close();
    await this.app.close();
    await Promise.all([this.database.stop(), this.mailbox.stop(), this.redis.stop()]);
  }
}
