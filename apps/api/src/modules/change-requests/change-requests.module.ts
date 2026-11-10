import { Module } from "@nestjs/common";

import { ChangeRequestsService } from "./application/change-requests.service.js";
import { ChangeRequestsRepository } from "./internal/change-requests.repository.js";

@Module({
  providers: [ChangeRequestsRepository, ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
