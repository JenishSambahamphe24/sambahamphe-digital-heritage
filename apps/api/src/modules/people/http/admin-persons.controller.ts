import type { IAuthContext } from "../../auth/auth.types.js";
import type {
  TAdminPersonListResponse,
  TAdminPersonResponse,
  TConsentResponse,
  TCreatePersonRequest,
  TIdParams,
  TListPersonsQuery,
  TPersonConsentParams,
  TRecordConsentRequest,
  TRetractPersonRequest,
  TUpdatePersonRequest,
} from "@repo/contracts";

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  adminPersonListResponseSchema,
  adminPersonResponseSchema,
  consentResponseSchema,
  createPersonRequestSchema,
  idParamsSchema,
  listPersonsQuerySchema,
  personConsentParamsSchema,
  recordConsentRequestSchema,
  retractPersonRequestSchema,
  updatePersonRequestSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
import { CurrentAuth } from "../../auth/guards/current-auth.decorator.js";
import { PersonsService } from "../application/persons.service.js";

@ApiTags("admin")
@ApiProblemResponse()
@RequirePermission(PERMISSION.genealogyEdit)
@Controller("admin/persons")
export class AdminPersonsController {
  constructor(private readonly persons: PersonsService) {}

  @Get()
  @ApiOkResponse({ standardSchema: adminPersonListResponseSchema })
  list(
    @Query({ schema: listPersonsQuerySchema }) query: TListPersonsQuery,
  ): Promise<TAdminPersonListResponse> {
    return this.persons.listForEditor(query);
  }

  @Get(":id")
  @ApiOkResponse({ standardSchema: adminPersonResponseSchema })
  get(@Param({ schema: idParamsSchema }) params: TIdParams): Promise<TAdminPersonResponse> {
    return this.persons.getForEditor(params.id);
  }

  @Post()
  @ApiCreatedResponse({ standardSchema: adminPersonResponseSchema })
  create(
    @CurrentAuth() auth: IAuthContext,
    @Body({ schema: createPersonRequestSchema }) body: TCreatePersonRequest,
  ): Promise<TAdminPersonResponse> {
    return this.persons.create(auth.user.id, body);
  }

  @Patch(":id")
  @ApiOkResponse({ standardSchema: adminPersonResponseSchema })
  update(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: updatePersonRequestSchema }) body: TUpdatePersonRequest,
  ): Promise<TAdminPersonResponse> {
    return this.persons.update(auth.user.id, params.id, body);
  }

  @Post(":id/retract")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ standardSchema: adminPersonResponseSchema })
  retract(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: retractPersonRequestSchema }) body: TRetractPersonRequest,
  ): Promise<TAdminPersonResponse> {
    return this.persons.retract(auth.user.id, params.id, body);
  }

  @Post(":id/consents")
  @ApiCreatedResponse({ standardSchema: consentResponseSchema })
  recordConsent(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: recordConsentRequestSchema }) body: TRecordConsentRequest,
  ): Promise<TConsentResponse> {
    return this.persons.recordConsent(auth.user.id, params.id, body);
  }

  @Delete(":id/consents/:consentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Consent revoked" })
  revokeConsent(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: personConsentParamsSchema }) params: TPersonConsentParams,
  ): Promise<void> {
    return this.persons.revokeConsent(auth.user.id, params.id, params.consentId);
  }
}
