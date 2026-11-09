import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AppException } from "../../../core/errors/app.exception.js";
import { SessionService } from "../application/session.service.js";
import { AuthClientHelper } from "../domain/auth-client.helper.js";
import { IS_PUBLIC_KEY } from "./public.decorator.js";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const client = AuthClientHelper.fromRequest(request);
    const token = AuthClientHelper.sessionToken(request, client);

    // Public routes still resolve the viewer when a session is present:
    // privacy-filtered data depends on who is looking.
    if (token) {
      request.auth = (await this.sessions.authenticate(token, client)) ?? undefined;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublic && !request.auth) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        "unauthenticated",
        "Not signed in",
        "Sign in to continue.",
      );
    }
    return true;
  }
}
