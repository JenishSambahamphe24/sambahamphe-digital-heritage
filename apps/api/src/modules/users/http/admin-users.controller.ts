import type {
  TAdminUserListResponse,
  TAdminUserResponse,
  TIdParams,
  TListUsersQuery,
} from "@repo/contracts";

import { Controller, Get, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  adminUserListResponseSchema,
  adminUserResponseSchema,
  idParamsSchema,
  listUsersQuerySchema,
} from "@repo/contracts";

import { AppException } from "../../../core/errors/app.exception.js";
import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
import { AdminUserResponseHelper } from "../admin-user-response.helper.js";
import { UsersRepository } from "../users.repository.js";

@ApiTags("admin")
@ApiProblemResponse()
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  @ApiOkResponse({ standardSchema: adminUserListResponseSchema })
  @RequirePermission(PERMISSION.userRead)
  async list(
    @Query({ schema: listUsersQuerySchema }) query: TListUsersQuery,
  ): Promise<TAdminUserListResponse> {
    const { rows, total } = await this.users.list({
      q: query.q,
      offset: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
    });
    return adminUserListResponseSchema.parse({
      data: rows.map((row) => AdminUserResponseHelper.fromRow(row)),
      page: { page: query.page, pageSize: query.pageSize, total },
    });
  }

  @Get(":id")
  @ApiOkResponse({ standardSchema: adminUserResponseSchema })
  @RequirePermission(PERMISSION.userRead)
  async get(@Param({ schema: idParamsSchema }) params: TIdParams): Promise<TAdminUserResponse> {
    const row = await this.users.findById(params.id);
    if (!row) {
      throw new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "User not found.");
    }
    return AdminUserResponseHelper.fromRow(row);
  }
}
