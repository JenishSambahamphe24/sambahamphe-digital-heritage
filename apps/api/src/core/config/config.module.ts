import type { TEnv } from "./env.schema.js";
import type { DynamicModule } from "@nestjs/common";

import { Global, Module } from "@nestjs/common";

import { AppConfig } from "./app-config.js";

@Global()
@Module({})
export class ConfigModule {
  static forRoot(env: TEnv): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: AppConfig, useValue: new AppConfig(env) }],
      exports: [AppConfig],
    };
  }
}
