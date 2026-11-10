import { Module } from "@nestjs/common";

import { AccessModule } from "../access/access.module.js";
import { ChangeRequestsModule } from "../change-requests/change-requests.module.js";
import { PlacesModule } from "../places/places.module.js";
import { PersonsService } from "./application/persons.service.js";
import { AdminPersonsController } from "./http/admin-persons.controller.js";
import { PersonsController } from "./http/persons.controller.js";
import { PersonsRepository } from "./internal/persons.repository.js";

@Module({
  imports: [AccessModule, ChangeRequestsModule, PlacesModule],
  controllers: [PersonsController, AdminPersonsController],
  providers: [PersonsRepository, PersonsService],
})
export class PeopleModule {}
