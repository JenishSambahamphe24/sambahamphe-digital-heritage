import type { IAuthContext } from "../../auth/auth.types.js";
import type {
  TAssignRoleRequest,
  TIdParams,
  TRoleAssignmentListResponse,
  TRoleAssignmentResponse,
  TRoleListResponse,
} from "@repo/contracts";

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  assignRoleRequestSchema,
  idParamsSchema,
  roleAssignmentListResponseSchema,
  roleAssignmentResponseSchema,
  roleListResponseSchema,
  roleResponseSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { CurrentAuth } from "../../auth/guards/current-auth.decorator.js";
import { PERMISSION } from "../access.catalog.js";
import { RoleAssignmentsService } from "../application/role-assignments.service.js";
import { RequirePermission } from "../guards/require-permission.decorator.js";
import { AccessRepository } from "../internal/access.repository.js";
import { RoleAssignmentResponseHelper } from "../role-assignment-response.helper.js";

@ApiTags("admin")
@ApiProblemResponse()
@Controller("admin")
export class AdminAccessController {
  constructor(
    private readonly access: AccessRepository,
    private readonly assignments: RoleAssignmentsService,
  ) {}

  @Get("roles")
  @ApiOkResponse({ standardSchema: roleListResponseSchema })
  @RequirePermission(PERMISSION.roleRead)
  async listRoles(): Promise<TRoleListResponse> {
    const rows = await this.access.rolesWithPermissions();
    return roleListResponseSchema.parse({
      data: rows.map(({ role, permissions }) =>
        roleResponseSchema.parse({
          key: role.key,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissions,
        }),
      ),
    });
  }

  @Get("users/:id/role-assignments")
  @ApiOkResponse({ standardSchema: roleAssignmentListResponseSchema })
  @RequirePermission(PERMISSION.roleRead)
  async listUserAssignments(
    @Param({ schema: idParamsSchema }) params: TIdParams,
  ): Promise<TRoleAssignmentListResponse> {
    const rows = await this.access.assignmentsForUser(params.id);
    return roleAssignmentListResponseSchema.parse({
      data: rows.map(({ assignment, roleKey }) =>
        RoleAssignmentResponseHelper.fromRow(assignment, roleKey),
      ),
    });
  }

  @Post("role-assignments")
  @ApiCreatedResponse({ standardSchema: roleAssignmentResponseSchema })
  @RequirePermission(PERMISSION.roleAssign)
  async assign(
    @CurrentAuth() auth: IAuthContext,
    @Body({ schema: assignRoleRequestSchema }) body: TAssignRoleRequest,
  ): Promise<TRoleAssignmentResponse> {
    const assignment = await this.assignments.assign(auth.user.id, body);
    return RoleAssignmentResponseHelper.fromRow(assignment, body.roleKey);
  }

  @Delete("role-assignments/:id")
  @ApiNoContentResponse({ description: "Role assignment revoked" })
  @RequirePermission(PERMISSION.roleAssign)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
  ): Promise<void> {
    await this.assignments.revoke(auth.user.id, params.id);
  }
}
