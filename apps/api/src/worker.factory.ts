import type { TEnv } from "./core/config/env.schema.js";
import type { INestApplicationContext } from "@nestjs/common";

import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { WorkerModule } from "./worker.module.js";

export class WorkerFactory {
  static async create(env: TEnv): Promise<INestApplicationContext> {
    const worker = await NestFactory.createApplicationContext(WorkerModule.forRoot(env), {
      bufferLogs: true,
    });
    worker.useLogger(worker.get(Logger));
    worker.enableShutdownHooks();
    return worker;
  }
}
