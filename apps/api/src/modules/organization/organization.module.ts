import { Module } from "@nestjs/common";

import { AccessModule } from "../access/access.module.js";
import { ChangeRequestsModule } from "../change-requests/change-requests.module.js";
import { PeopleModule } from "../people/people.module.js";
import { PlacesModule } from "../places/places.module.js";
import { AppointmentsService } from "./application/appointments.service.js";
import { BoardService } from "./application/board.service.js";
import { OrgScopeService } from "./application/org-scope.service.js";
import { OrgUnitsService } from "./application/org-units.service.js";
import { PersonOptionsService } from "./application/person-options.service.js";
import { PositionsService } from "./application/positions.service.js";
import { TermsService } from "./application/terms.service.js";
import { AdminOrganizationController } from "./http/admin-organization.controller.js";
import { OrganizationController } from "./http/organization.controller.js";
import { AppointmentsRepository } from "./internal/appointments.repository.js";
import { OrgUnitsRepository } from "./internal/org-units.repository.js";
import { PositionsRepository } from "./internal/positions.repository.js";
import { TermsRepository } from "./internal/terms.repository.js";

@Module({
  imports: [AccessModule, ChangeRequestsModule, PeopleModule, PlacesModule],
  controllers: [OrganizationController, AdminOrganizationController],
  providers: [
    OrgUnitsRepository,
    PositionsRepository,
    TermsRepository,
    AppointmentsRepository,
    OrgScopeService,
    OrgUnitsService,
    PositionsService,
    TermsService,
    AppointmentsService,
    BoardService,
    PersonOptionsService,
  ],
})
export class OrganizationModule {}
