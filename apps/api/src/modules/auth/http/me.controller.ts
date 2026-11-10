import type { IAuthContext } from "../auth.types.js";
import type { TIdParams, TSessionListResponse, TUserResponse } from "@repo/contracts";
import type { Response } from "express";

import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Res } from "@nestjs/common";
import { ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { idParamsSchema, sessionListResponseSchema, userResponseSchema } from "@repo/contracts";

import { AppConfig } from "../../../core/config/app-config.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { UserResponseHelper } from "../../users/user-response.helper.js";
import { SessionService } from "../application/session.service.js";
import { SessionCookieHelper } from "../domain/session-cookie.helper.js";
import { CurrentAuth } from "../guards/current-auth.decorator.js";

@ApiTags("me")
@ApiHeader({
  name: "X-Client",
  required: false,
  description: "web (default), admin or mobile; picks the session cookie or Bearer token",
  enum: ["web", "admin", "mobile"],
})
@ApiProblemResponse()
@Controller("me")
export class MeController {
  constructor(
    private readonly sessions: SessionService,
    private readonly config: AppConfig,
  ) {}

  @Get()
  @ApiOkResponse({ standardSchema: userResponseSchema })
  me(@CurrentAuth() auth: IAuthContext): TUserResponse {
    return UserResponseHelper.fromRow(auth.user);
  }

  @Get("sessions")
  @ApiOkResponse({ standardSchema: sessionListResponseSchema })
  async listSessions(@CurrentAuth() auth: IAuthContext): Promise<TSessionListResponse> {
    const rows = await this.sessions.listActive(auth.user.id);
    return sessionListResponseSchema.parse({
      data: rows.map((row) => ({
        id: row.id,
        client: row.client,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
        lastSeenAt: row.lastSeenAt.toISOString(),
        current: row.id === auth.session.id,
      })),
    });
  }

  @Delete("sessions/:id")
  @ApiNoContentResponse({ description: "Session revoked" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentAuth() auth: IAuthContext,
    @Param({ schema: idParamsSchema }) params: TIdParams,
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
