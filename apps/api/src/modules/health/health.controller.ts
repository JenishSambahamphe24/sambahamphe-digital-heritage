import type { IHealthStatus, IReadinessStatus } from "./health.types.js";

import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/guards/public.decorator.js";
import { HealthService } from "./health.service.js";

@Public()
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
