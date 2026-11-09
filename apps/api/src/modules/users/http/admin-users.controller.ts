import type { TAdminUserResponse } from "./dto/admin-user.response.dto.js";
import type { TListUsersQuery } from "./dto/list-users.query.dto.js";

import { Controller, Get, Query } from "@nestjs/common";

import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
import { UsersRepository } from "../users.repository.js";
import { adminUserResponseSchema } from "./dto/admin-user.response.dto.js";
import { listUsersQuerySchema } from "./dto/list-users.query.dto.js";

interface IOffsetPage<T> {
  data: T[];
  page: { page: number; pageSize: number; total: number };
}

@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  @RequirePermission(PERMISSION.userRead)
  async list(
    @Query({ schema: listUsersQuerySchema }) query: TListUsersQuery,
  ): Promise<IOffsetPage<TAdminUserResponse>> {
    const { rows, total } = await this.users.list({
      q: query.q,
      offset: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
    });
    return {
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
    };
  }
}
