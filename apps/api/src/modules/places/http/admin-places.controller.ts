import type { IAuthContext } from "../../auth/auth.types.js";
import type {
  TCreatePlaceRequest,
  TIdParams,
  TPlaceResponse,
  TUpdatePlaceRequest,
} from "@repo/contracts";

import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  createPlaceRequestSchema,
  idParamsSchema,
  placeResponseSchema,
  updatePlaceRequestSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
import { CurrentAuth } from "../../auth/guards/current-auth.decorator.js";
import { PlacesService } from "../application/places.service.js";

@ApiTags("admin")
@ApiProblemResponse()
@Controller("admin/places")
export class AdminPlacesController {
  constructor(private readonly places: PlacesService) {}

  @Post()
  @ApiCreatedResponse({ standardSchema: placeResponseSchema })
  @RequirePermission(PERMISSION.placeManage)
  create(
    @CurrentAuth() auth: IAuthContext,
    @Body({ schema: createPlaceRequestSchema }) body: TCreatePlaceRequest,
  ): Promise<TPlaceResponse> {
    return this.places.create(auth.user.id, body);
  }

  @Patch(":id")
  @ApiOkResponse({ standardSchema: placeResponseSchema })
  @RequirePermission(PERMISSION.placeManage)
  update(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: updatePlaceRequestSchema }) body: TUpdatePlaceRequest,
  ): Promise<TPlaceResponse> {
    return this.places.update(auth.user.id, params.id, body);
  }
}
