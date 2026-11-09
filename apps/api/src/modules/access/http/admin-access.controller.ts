import type { IAuthContext } from "../../auth/auth.types.js";
import type {
  TAssignRoleRequest,
  TIdParams,
  TRoleAssignmentResponse,
  TRoleResponse,
} from "@repo/contracts";

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";

import { assignRoleRequestSchema, idParamsSchema, roleResponseSchema } from "@repo/contracts";

import { CurrentAuth } from "../../auth/guards/current-auth.decorator.js";
import { PERMISSION } from "../access.catalog.js";
import { RoleAssignmentsService } from "../application/role-assignments.service.js";
import { RequirePermission } from "../guards/require-permission.decorator.js";
import { AccessRepository } from "../internal/access.repository.js";
import { RoleAssignmentResponseHelper } from "../role-assignment-response.helper.js";

@Controller("admin")
export class AdminAccessController {
  constructor(
    private readonly access: AccessRepository,
    private readonly assignments: RoleAssignmentsService,
  ) {}

  @Get("roles")
  @RequirePermission(PERMISSION.roleRead)
  async listRoles(): Promise<{ data: TRoleResponse[] }> {
    const rows = await this.access.rolesWithPermissions();
    return {
      data: rows.map(({ role, permissions }) =>
        roleResponseSchema.parse({
          key: role.key,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissions,
        }),
      ),
    };
  }

  @Get("users/:id/role-assignments")
  @RequirePermission(PERMISSION.roleRead)
  async listUserAssignments(
    @Param({ schema: idParamsSchema }) params: TIdParams,
  ): Promise<{ data: TRoleAssignmentResponse[] }> {
    const rows = await this.access.assignmentsForUser(params.id);
    return {
      data: rows.map(({ assignment, roleKey }) =>
        RoleAssignmentResponseHelper.fromRow(assignment, roleKey),
      ),
    };
  }

  @Post("role-assignments")
  @RequirePermission(PERMISSION.roleAssign)
  async assign(
    @CurrentAuth() auth: IAuthContext,
    @Body({ schema: assignRoleRequestSchema }) body: TAssignRoleRequest,
  ): Promise<TRoleAssignmentResponse> {
    const assignment = await this.assignments.assign(auth.user.id, body);
    return RoleAssignmentResponseHelper.fromRow(assignment, body.roleKey);
  }

  @Delete("role-assignments/:id")
  @RequirePermission(PERMISSION.roleAssign)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
  ): Promise<void> {
    await this.assignments.revoke(auth.user.id, params.id);
  }
}
