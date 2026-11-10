import type { IAuthContext } from "../../auth/auth.types.js";
import type {
  TIdParams,
  TListPersonsQuery,
  TPersonListResponse,
  TPersonResponse,
} from "@repo/contracts";
import type { Request } from "express";

import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  idParamsSchema,
  listPersonsQuerySchema,
  personListResponseSchema,
  personResponseSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { OptionalAuth } from "../../auth/guards/optional-auth.decorator.js";
import { Public } from "../../auth/guards/public.decorator.js";
import { PersonsService } from "../application/persons.service.js";

// Public, but the answer depends on who is asking: every response goes
// through the privacy policy, and hidden people are indistinguishable from
// missing ones.
@ApiTags("persons")
@ApiProblemResponse()
@Public()
@Controller("persons")
export class PersonsController {
  constructor(private readonly persons: PersonsService) {}

  @Get()
  @ApiOkResponse({ standardSchema: personListResponseSchema })
  list(
    @OptionalAuth() auth: IAuthContext | null,
    @Req() request: Request,
    @Query({ schema: listPersonsQuerySchema }) query: TListPersonsQuery,
  ): Promise<TPersonListResponse> {
    return this.persons.listForViewer(auth, request, query);
  }

  @Get(":id")
  @ApiOkResponse({ standardSchema: personResponseSchema })
  get(
    @OptionalAuth() auth: IAuthContext | null,
    @Req() request: Request,
    @Param({ schema: idParamsSchema }) params: TIdParams,
  ): Promise<TPersonResponse> {
    return this.persons.getForViewer(auth, request, params.id);
  }
}
