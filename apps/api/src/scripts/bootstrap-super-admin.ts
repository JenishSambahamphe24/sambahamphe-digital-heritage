import { parseArgs } from "node:util";

import { NestFactory } from "@nestjs/core";

import { EnvHelper } from "../core/config/env.helper.js";
import { RoleAssignmentsService } from "../modules/access/application/role-assignments.service.js";
import { ScriptModule } from "./script.module.js";

const { values } = parseArgs({ options: { email: { type: "string" } } });
if (!values.email) {
  console.error("Usage: pnpm --filter api admin:bootstrap --email you@example.com");
  process.exit(1);
}

const context = await NestFactory.createApplicationContext(
  ScriptModule.forRoot(EnvHelper.loadOrExit()),
  { logger: ["error", "warn"] },
);
try {
  await context.get(RoleAssignmentsService).bootstrapSuperAdmin(values.email);
  process.stdout.write(`Super administrator granted to ${values.email}.\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await context.close();
}
