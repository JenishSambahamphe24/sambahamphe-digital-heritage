import type {
  TIdParams,
  TListPlacesQuery,
  TPlaceListResponse,
  TPlaceResponse,
} from "@repo/contracts";

import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  idParamsSchema,
  listPlacesQuerySchema,
  placeListResponseSchema,
  placeResponseSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { Public } from "../../auth/guards/public.decorator.js";
import { PlacesService } from "../application/places.service.js";

// Places hold no personal data, so anyone may read them.
@ApiTags("places")
@ApiProblemResponse()
@Public()
@Controller("places")
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  @ApiOkResponse({ standardSchema: placeListResponseSchema })
  list(
    @Query({ schema: listPlacesQuerySchema }) query: TListPlacesQuery,
  ): Promise<TPlaceListResponse> {
    return this.places.list(query);
  }

  @Get(":id")
  @ApiOkResponse({ standardSchema: placeResponseSchema })
  get(@Param({ schema: idParamsSchema }) params: TIdParams): Promise<TPlaceResponse> {
    return this.places.get(params.id);
  }
}
