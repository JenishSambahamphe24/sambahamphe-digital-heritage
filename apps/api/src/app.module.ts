import type { TEnv } from "./core/config/env.schema.js";
import type { DynamicModule } from "@nestjs/common";

import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { AppConfig } from "./core/config/app-config.js";
import { ConfigModule } from "./core/config/config.module.js";
import { DatabaseModule } from "./core/database/database.module.js";
import { ProblemDetailsFilter } from "./core/errors/problem-details.filter.js";
import { LoggerOptionsHelper } from "./core/logging/logger-options.helper.js";
import { OutboxModule } from "./core/outbox/outbox.module.js";
import { DEFAULT_RATE_LIMIT } from "./modules/auth/auth.constants.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CsrfGuard } from "./modules/auth/guards/csrf.guard.js";
import { SessionGuard } from "./modules/auth/guards/session.guard.js";
import { HealthModule } from "./modules/health/health.module.js";

@Module({})
export class AppModule {
  static forRoot(env: TEnv): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(env),
        LoggerModule.forRootAsync({
          inject: [AppConfig],
          useFactory: (config: AppConfig) => LoggerOptionsHelper.create(config),
        }),
        // In-memory counters: correct for the single API instance we run.
        // Multiple instances would need shared (Redis) storage.
        ThrottlerModule.forRoot([{ name: "default", ...DEFAULT_RATE_LIMIT }]),
        DatabaseModule,
        OutboxModule,
        AuthModule,
        HealthModule,
      ],
      providers: [
        { provide: APP_FILTER, useClass: ProblemDetailsFilter },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: CsrfGuard },
        { provide: APP_GUARD, useClass: SessionGuard },
      ],
    };
  }
}
