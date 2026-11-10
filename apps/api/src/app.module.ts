import type { TEnv } from "./core/config/env.schema.js";
import type { DynamicModule, MiddlewareConsumer, NestModule } from "@nestjs/common";

import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { AuditModule } from "./core/audit/audit.module.js";
import { AppConfig } from "./core/config/app-config.js";
import { ConfigModule } from "./core/config/config.module.js";
import { DatabaseModule } from "./core/database/database.module.js";
import { ProblemDetailsFilter } from "./core/errors/problem-details.filter.js";
import { LoggerOptionsHelper } from "./core/logging/logger-options.helper.js";
import { OutboxModule } from "./core/outbox/outbox.module.js";
import { RequestContextMiddleware } from "./core/request-context/request-context.middleware.js";
import { AccessModule } from "./modules/access/access.module.js";
import { PermissionGuard } from "./modules/access/guards/permission.guard.js";
import { AuditLogModule } from "./modules/audit-log/audit-log.module.js";
import { DEFAULT_RATE_LIMIT } from "./modules/auth/auth.constants.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CsrfGuard } from "./modules/auth/guards/csrf.guard.js";
import { SessionGuard } from "./modules/auth/guards/session.guard.js";
import { HealthModule } from "./modules/health/health.module.js";
import { PeopleModule } from "./modules/people/people.module.js";
import { PlacesModule } from "./modules/places/places.module.js";
import { UsersModule } from "./modules/users/users.module.js";

@Module({})
export class AppModule implements NestModule {
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
        AuditModule,
        UsersModule,
        AccessModule,
        AuditLogModule,
        AuthModule,
        HealthModule,
        PlacesModule,
        PeopleModule,
      ],
      providers: [
        { provide: APP_FILTER, useClass: ProblemDetailsFilter },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: CsrfGuard },
        { provide: APP_GUARD, useClass: SessionGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
      ],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*path");
  }
}
