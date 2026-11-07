import type { IHealthStatus, IReadinessStatus } from "./health.types.js";

import { Controller, Get } from "@nestjs/common";

import { HealthService } from "./health.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("live")
  live(): IHealthStatus {
    return { status: "ok" };
  }

  @Get("ready")
  ready(): Promise<IReadinessStatus> {
    return this.health.readiness();
  }
}
