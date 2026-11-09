import type { IAuthContext, IRequestMeta } from "../auth.types.js";
import type {
  TConfirmPasswordResetRequest,
  TEmailRequest,
  TLoginRequest,
  TLoginResponse,
  TRegisterRequest,
  TTokenRequest,
} from "@repo/contracts";
import type { Request, Response } from "express";

import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import {
  ApiAcceptedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import {
  checkEmailResponseSchema,
  confirmPasswordResetRequestSchema,
  emailRequestSchema,
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  tokenRequestSchema,
} from "@repo/contracts";

import { AppConfig } from "../../../core/config/app-config.js";
import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { AuthService } from "../application/auth.service.js";
import { SessionService } from "../application/session.service.js";
import { AUTH_RATE_LIMIT } from "../auth.constants.js";
import { AuthClientHelper } from "../domain/auth-client.helper.js";
import { SessionCookieHelper } from "../domain/session-cookie.helper.js";
import { CurrentAuth } from "../guards/current-auth.decorator.js";
import { Public } from "../guards/public.decorator.js";

const CHECK_EMAIL = { status: "check_email" } as const;
const STRICT_LIMIT = { default: AUTH_RATE_LIMIT };

@ApiTags("auth")
@ApiHeader({
  name: "X-Client",
  required: false,
  description: "web (default), admin or mobile; picks the session cookie or Bearer token",
  enum: ["web", "admin", "mobile"],
})
@ApiProblemResponse()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post("register")
  @ApiAcceptedResponse({
    standardSchema: checkEmailResponseSchema,
    description: "Same answer whether or not the email is registered",
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async register(@Body({ schema: registerRequestSchema }) body: TRegisterRequest) {
    await this.auth.register(body);
    return CHECK_EMAIL;
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post("verify-email")
  @ApiNoContentResponse({ description: "Email verified" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body({ schema: tokenRequestSchema }) body: TTokenRequest): Promise<void> {
    await this.auth.verifyEmail(body.token);
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post("resend-verification")
  @ApiAcceptedResponse({ standardSchema: checkEmailResponseSchema })
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(@Body({ schema: emailRequestSchema }) body: TEmailRequest) {
    await this.auth.resendVerification(body.email);
    return CHECK_EMAIL;
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post("login")
  @ApiOkResponse({
    standardSchema: loginResponseSchema,
    description: "Browsers get an HttpOnly sid / admin_sid cookie; mobile gets sessionToken",
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body({ schema: loginRequestSchema }) body: TLoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TLoginResponse> {
    const client = AuthClientHelper.fromRequest(request);
    const result = await this.auth.login(body, client, AuthController.meta(request));
    if (client === "mobile") {
      return loginResponseSchema.parse({ user: result.user, sessionToken: result.token });
    }
    SessionCookieHelper.set(
      response,
      client,
      result.token,
      result.expiresAt,
      this.config.cookieSecure,
    );
    return loginResponseSchema.parse({ user: result.user });
  }

  @Post("logout")
  @ApiNoContentResponse({ description: "Session revoked" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentAuth() auth: IAuthContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.sessions.revoke(auth.session.id, auth.user.id, "logout");
    if (auth.client !== "mobile") {
      SessionCookieHelper.clear(response, auth.client, this.config.cookieSecure);
    }
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post("password-reset")
  @ApiAcceptedResponse({ standardSchema: checkEmailResponseSchema })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPasswordReset(@Body({ schema: emailRequestSchema }) body: TEmailRequest) {
    await this.auth.requestPasswordReset(body.email);
    return CHECK_EMAIL;
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post("password-reset/confirm")
  @ApiNoContentResponse({ description: "Password changed; every session signed out" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPasswordReset(
    @Body({ schema: confirmPasswordResetRequestSchema }) body: TConfirmPasswordResetRequest,
  ): Promise<void> {
    await this.auth.confirmPasswordReset(body.token, body.newPassword);
  }

  private static meta(request: Request): IRequestMeta {
    return { userAgent: request.headers["user-agent"] ?? null, ip: request.ip };
  }
}
