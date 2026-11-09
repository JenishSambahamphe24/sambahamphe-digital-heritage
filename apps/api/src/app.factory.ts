import type { TEnv } from "./core/config/env.schema.js";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { RequestMethod, StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module.js";
import { ValidationExceptionHelper } from "./core/validation/validation-exception.helper.js";

export const API_PREFIX = "api/v1";

const JSON_BODY_LIMIT = "100kb";

const UNPREFIXED_ROUTES = [
  { path: "health/live", method: RequestMethod.GET },
  { path: "health/ready", method: RequestMethod.GET },
];

export class AppFactory {
  static async create(env: TEnv): Promise<NestExpressApplication> {
    // bodyParser off: only JSON is parsed, so cross-site HTML form posts
    // (urlencoded/multipart) can never reach a handler as data.
    const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(env), {
      bufferLogs: true,
      bodyParser: false,
    });
    app.useLogger(app.get(Logger));
    app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
    app.use(cookieParser());
    app.set("trust proxy", env.TRUST_PROXY_HOPS);
    app.disable("x-powered-by");
    app.useGlobalPipes(
      new StandardSchemaValidationPipe({
        exceptionFactory: (issues) => ValidationExceptionHelper.fromIssues(issues),
      }),
    );
    app.setGlobalPrefix(API_PREFIX, { exclude: UNPREFIXED_ROUTES });
    app.enableShutdownHooks();
    return app;
  }
}
