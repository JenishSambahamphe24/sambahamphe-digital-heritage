import type { TEnv } from "./core/config/env.schema.js";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module.js";

export const API_PREFIX = "api/v1";

const UNPREFIXED_ROUTES = [
  { path: "health/live", method: RequestMethod.GET },
  { path: "health/ready", method: RequestMethod.GET },
];

export class AppFactory {
  static async create(env: TEnv): Promise<NestExpressApplication> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(env), {
      bufferLogs: true,
    });
    app.useLogger(app.get(Logger));
    app.disable("x-powered-by");
    app.setGlobalPrefix(API_PREFIX, { exclude: UNPREFIXED_ROUTES });
    app.enableShutdownHooks();
    return app;
  }
}
