import type { IHealthStatus, IReadinessStatus } from "./health.types.js";

import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/guards/public.decorator.js";
import { HealthService } from "./health.service.js";

@Public()
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("live")
  @ApiOkResponse({ description: "The process is running" })
  live(): IHealthStatus {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOkResponse({ description: "The process and its database are reachable" })
  @ApiServiceUnavailableResponse({ description: "The database is unreachable" })
  ready(): Promise<IReadinessStatus> {
    return this.health.readiness();
  }
}
