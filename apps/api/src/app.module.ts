import type { TEnv } from "./core/config/env.schema.js";
import type { DynamicModule } from "@nestjs/common";

import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";

import { AppConfig } from "./core/config/app-config.js";
import { ConfigModule } from "./core/config/config.module.js";
import { DatabaseModule } from "./core/database/database.module.js";
import { ProblemDetailsFilter } from "./core/errors/problem-details.filter.js";
import { LoggerOptionsHelper } from "./core/logging/logger-options.helper.js";
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
        DatabaseModule,
        HealthModule,
      ],
      providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
    };
  }
}
