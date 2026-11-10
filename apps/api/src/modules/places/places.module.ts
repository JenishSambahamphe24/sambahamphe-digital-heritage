import { Module } from "@nestjs/common";

import { PlacesService } from "./application/places.service.js";
import { AdminPlacesController } from "./http/admin-places.controller.js";
import { PlacesController } from "./http/places.controller.js";
import { PlacesRepository } from "./internal/places.repository.js";

@Module({
  controllers: [PlacesController, AdminPlacesController],
  providers: [PlacesRepository, PlacesService],
  exports: [PlacesRepository],
})
export class PlacesModule {}
