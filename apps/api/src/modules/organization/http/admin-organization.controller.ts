import type { IAuthContext } from "../../auth/auth.types.js";
import type {
  TAppointmentListResponse,
  TAppointmentResponse,
  TCreateAppointmentRequest,
  TCreateOrgUnitRequest,
  TCreatePositionRequest,
  TCreateTermRequest,
  TIdParams,
  TOrgUnitChildParams,
  TOrgUnitResponse,
  TPositionResponse,
  TRetractAppointmentRequest,
  TTermResponse,
  TUpdateAppointmentRequest,
  TUpdateOrgUnitRequest,
  TUpdatePositionRequest,
  TUpdateTermRequest,
} from "@repo/contracts";
import type { Request } from "express";

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  appointmentListResponseSchema,
  appointmentResponseSchema,
  createAppointmentRequestSchema,
  createOrgUnitRequestSchema,
  createPositionRequestSchema,
  createTermRequestSchema,
  idParamsSchema,
  orgUnitChildParamsSchema,
  orgUnitResponseSchema,
  positionResponseSchema,
  retractAppointmentRequestSchema,
  termResponseSchema,
  updateAppointmentRequestSchema,
  updateOrgUnitRequestSchema,
  updatePositionRequestSchema,
  updateTermRequestSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
import { CurrentAuth } from "../../auth/guards/current-auth.decorator.js";
import { AppointmentsService } from "../application/appointments.service.js";
import { OrgUnitsService } from "../application/org-units.service.js";
import { PositionsService } from "../application/positions.service.js";
import { TermsService } from "../application/terms.service.js";

// Board routes check org:manage against the board's path in the service (a
// manager may be limited to one board); positions are organization-wide and
// need a global grant.
@ApiTags("admin")
@ApiProblemResponse()
@Controller("admin/org")
export class AdminOrganizationController {
  constructor(
    private readonly units: OrgUnitsService,
    private readonly positions: PositionsService,
    private readonly terms: TermsService,
    private readonly appointments: AppointmentsService,
  ) {}

  @Post("units")
  @ApiCreatedResponse({ standardSchema: orgUnitResponseSchema })
  createUnit(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Body({ schema: createOrgUnitRequestSchema }) body: TCreateOrgUnitRequest,
  ): Promise<TOrgUnitResponse> {
    return this.units.create(request, auth.user.id, body);
  }

  @Patch("units/:id")
  @ApiOkResponse({ standardSchema: orgUnitResponseSchema })
  updateUnit(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: updateOrgUnitRequestSchema }) body: TUpdateOrgUnitRequest,
  ): Promise<TOrgUnitResponse> {
    return this.units.update(request, auth.user.id, params.id, body);
  }

  @Post("units/:id/terms")
  @ApiCreatedResponse({ standardSchema: termResponseSchema })
  createTerm(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: createTermRequestSchema }) body: TCreateTermRequest,
  ): Promise<TTermResponse> {
    return this.terms.create(request, auth.user.id, params.id, body);
  }

  @Patch("units/:id/terms/:childId")
  @ApiOkResponse({ standardSchema: termResponseSchema })
  updateTerm(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: orgUnitChildParamsSchema }) params: TOrgUnitChildParams,
    @Body({ schema: updateTermRequestSchema }) body: TUpdateTermRequest,
  ): Promise<TTermResponse> {
    return this.terms.update(request, auth.user.id, params.id, params.childId, body);
  }

  @Get("units/:id/appointments")
  @ApiOkResponse({ standardSchema: appointmentListResponseSchema })
  listAppointments(
    @Req() request: Request,
    @Param({ schema: idParamsSchema }) params: TIdParams,
  ): Promise<TAppointmentListResponse> {
    return this.appointments.listForUnit(request, params.id);
  }

  @Post("units/:id/appointments")
  @ApiCreatedResponse({ standardSchema: appointmentResponseSchema })
  createAppointment(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: createAppointmentRequestSchema }) body: TCreateAppointmentRequest,
  ): Promise<TAppointmentResponse> {
    return this.appointments.create(request, auth.user.id, params.id, body);
  }

  @Patch("units/:id/appointments/:childId")
  @ApiOkResponse({ standardSchema: appointmentResponseSchema })
  updateAppointment(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: orgUnitChildParamsSchema }) params: TOrgUnitChildParams,
    @Body({ schema: updateAppointmentRequestSchema }) body: TUpdateAppointmentRequest,
  ): Promise<TAppointmentResponse> {
    return this.appointments.update(request, auth.user.id, params.id, params.childId, body);
  }

  @Post("units/:id/appointments/:childId/retract")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ standardSchema: appointmentResponseSchema })
  retractAppointment(
    @Req() request: Request,
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: orgUnitChildParamsSchema }) params: TOrgUnitChildParams,
    @Body({ schema: retractAppointmentRequestSchema }) body: TRetractAppointmentRequest,
  ): Promise<TAppointmentResponse> {
    return this.appointments.retract(request, auth.user.id, params.id, params.childId, body);
  }

  @Post("positions")
  @ApiCreatedResponse({ standardSchema: positionResponseSchema })
  @RequirePermission(PERMISSION.orgManage)
  createPosition(
    @CurrentAuth() auth: IAuthContext,
    @Body({ schema: createPositionRequestSchema }) body: TCreatePositionRequest,
  ): Promise<TPositionResponse> {
    return this.positions.create(auth.user.id, body);
  }

  @Patch("positions/:id")
  @ApiOkResponse({ standardSchema: positionResponseSchema })
  @RequirePermission(PERMISSION.orgManage)
  updatePosition(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Body({ schema: updatePositionRequestSchema }) body: TUpdatePositionRequest,
  ): Promise<TPositionResponse> {
    return this.positions.update(auth.user.id, params.id, body);
  }
}
