import type { TEnv } from "./core/config/env.schema.js";
import type { DynamicModule } from "@nestjs/common";

import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { AppConfig } from "./core/config/app-config.js";
import { ConfigModule } from "./core/config/config.module.js";
import { DatabaseModule } from "./core/database/database.module.js";
import { LoggerOptionsHelper } from "./core/logging/logger-options.helper.js";
import { EMAIL_QUEUE } from "./core/queue/queue.constants.js";
import { RedisConnectionService } from "./core/queue/redis-connection.service.js";
import { RedisModule } from "./core/queue/redis.module.js";
import { EmailProcessor } from "./workers/email.processor.js";
import { MailerService } from "./workers/mailer.service.js";
import { OutboxDispatcherService } from "./workers/outbox-dispatcher.service.js";

@Module({})
export class WorkerModule {
  static forRoot(env: TEnv): DynamicModule {
    return {
      module: WorkerModule,
      imports: [
        ConfigModule.forRoot(env),
        LoggerModule.forRootAsync({
          inject: [AppConfig],
          useFactory: (config: AppConfig) => LoggerOptionsHelper.create(config),
        }),
        DatabaseModule,
        RedisModule,
        BullModule.forRootAsync({
          inject: [RedisConnectionService],
          useFactory: (redis: RedisConnectionService) => ({ connection: redis.client }),
        }),
        BullModule.registerQueue({ name: EMAIL_QUEUE }),
      ],
      providers: [OutboxDispatcherService, MailerService, EmailProcessor],
    };
  }
}
