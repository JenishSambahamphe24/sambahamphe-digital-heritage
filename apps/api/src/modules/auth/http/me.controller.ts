import type { TUserResponse } from "../../users/dto/user.response.dto.js";
import type { IAuthContext } from "../auth.types.js";
import type { TSessionIdParams } from "./dto/session-id.params.dto.js";
import type { TSessionResponse } from "./dto/session.response.dto.js";
import type { Response } from "express";

import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Res } from "@nestjs/common";

import { AppConfig } from "../../../core/config/app-config.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { UserResponseHelper } from "../../users/user-response.helper.js";
import { SessionService } from "../application/session.service.js";
import { SessionCookieHelper } from "../domain/session-cookie.helper.js";
import { CurrentAuth } from "../guards/current-auth.decorator.js";
import { sessionIdParamsSchema } from "./dto/session-id.params.dto.js";
import { sessionResponseSchema } from "./dto/session.response.dto.js";

@Controller("me")
export class MeController {
  constructor(
    private readonly sessions: SessionService,
    private readonly config: AppConfig,
  ) {}

  @Get()
  me(@CurrentAuth() auth: IAuthContext): TUserResponse {
    return UserResponseHelper.fromRow(auth.user);
  }

  @Get("sessions")
  async listSessions(@CurrentAuth() auth: IAuthContext): Promise<{ data: TSessionResponse[] }> {
    const rows = await this.sessions.listActive(auth.user.id);
    return {
      data: rows.map((row) =>
        sessionResponseSchema.parse({
          id: row.id,
          client: row.client,
          userAgent: row.userAgent,
          createdAt: row.createdAt.toISOString(),
          lastSeenAt: row.lastSeenAt.toISOString(),
          current: row.id === auth.session.id,
        }),
      ),
    };
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: sessionIdParamsSchema }) params: TSessionIdParams,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const revoked = await this.sessions.revoke(params.id, auth.user.id, "logout");
    if (!revoked) {
      throw new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Session not found.");
    }
    if (params.id === auth.session.id && auth.client !== "mobile") {
      SessionCookieHelper.clear(response, auth.client, this.config.cookieSecure);
    }
  }
}
