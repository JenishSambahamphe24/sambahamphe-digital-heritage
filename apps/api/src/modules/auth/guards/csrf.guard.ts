import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";

import { AppConfig } from "../../../core/config/app-config.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { AuthClientHelper } from "../domain/auth-client.helper.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const JSON_CONTENT_TYPE = "application/json";

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    // Mobile sends a Bearer token the browser never attaches automatically,
    // so there is no ambient credential to forge.
    if (AuthClientHelper.fromRequest(request) !== "mobile") {
      const origin = request.headers.origin;
      if (!origin || !this.config.allowedOrigins.includes(origin)) {
        throw new AppException(
          HttpStatus.FORBIDDEN,
          "csrf_rejected",
          "Request rejected",
          "This request did not come from an allowed origin.",
        );
      }
    }

    const hasBody = Number(request.headers["content-length"] ?? 0) > 0;
    if (hasBody && !request.is(JSON_CONTENT_TYPE)) {
      throw new AppException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "unsupported_media_type",
        "Unsupported media type",
        "Request bodies must be JSON.",
      );
    }
    return true;
  }
}
