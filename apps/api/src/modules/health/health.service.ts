import type { IReadinessStatus } from "./health.types.js";

import { HttpStatus, Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "../../core/database/database.service.js";
import { AppException } from "../../core/errors/app.exception.js";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly database: DatabaseService) {}

  async readiness(): Promise<IReadinessStatus> {
    try {
      await this.database.ping();
    } catch (error) {
      this.logger.warn({ err: error }, "Readiness check failed: database unreachable");
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "service_unavailable",
        "Service unavailable",
        "The database is not reachable.",
      );
    }
    return { status: "ok", checks: { database: "ok" } };
  }
}
