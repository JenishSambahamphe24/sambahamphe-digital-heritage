import type { TAdminUserListResponse, TListUsersQuery } from "@repo/contracts";

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  adminUserListResponseSchema,
  adminUserResponseSchema,
  listUsersQuerySchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
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
      data: rows.map((row) =>
        adminUserResponseSchema.parse({
          id: row.id,
          email: row.email,
          emailVerified: row.emailVerifiedAt !== null,
          displayName: row.displayName,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
        }),
      ),
      page: { page: query.page, pageSize: query.pageSize, total },
    });
  }
}
