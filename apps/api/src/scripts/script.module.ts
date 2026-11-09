import type { TEnv } from "../core/config/env.schema.js";
import type { DynamicModule } from "@nestjs/common";

import { Module } from "@nestjs/common";

import { AuditModule } from "../core/audit/audit.module.js";
import { ConfigModule } from "../core/config/config.module.js";
import { DatabaseModule } from "../core/database/database.module.js";
import { AccessModule } from "../modules/access/access.module.js";

@Module({})
export class ScriptModule {
  static forRoot(env: TEnv): DynamicModule {
    return {
      module: ScriptModule,
      imports: [ConfigModule.forRoot(env), DatabaseModule, AuditModule, AccessModule],
    };
  }
}
