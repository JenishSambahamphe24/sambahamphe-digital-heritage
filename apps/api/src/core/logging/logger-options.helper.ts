import type { AppConfig } from "../config/app-config.js";
import type { Params } from "nestjs-pino";

import { RequestIdHelper } from "./request-id.helper.js";

const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

const HEALTH_PATH_PREFIX = "/health/";

export class LoggerOptionsHelper {
  static create(config: AppConfig): Params {
    return {
      pinoHttp: {
        level: config.logLevel,
        genReqId: (request, response) => RequestIdHelper.assign(request, response),
        redact: { paths: REDACTED_PATHS, censor: "[redacted]" },
        autoLogging: {
          ignore: (request) => request.url?.startsWith(HEALTH_PATH_PREFIX) ?? false,
        },
        transport: config.isDevelopment
          ? { target: "pino-pretty", options: { singleLine: true } }
          : undefined,
      },
    };
  }
}
