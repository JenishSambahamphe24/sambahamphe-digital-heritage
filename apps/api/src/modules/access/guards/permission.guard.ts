import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AppException } from "../../../core/errors/app.exception.js";
import { AccessService } from "../application/access.service.js";
import { PermissionPolicyHelper } from "../domain/permission-policy.helper.js";
import { REQUIRED_PERMISSION_KEY } from "./require-permission.decorator.js";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly access: AccessService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const required = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isAdminClient = request.auth?.client === "admin";
    if (!required && !isAdminClient) {
      return true;
    }

    const grants = await this.access.grantsForRequest(request);

    // Checked per request, not only at login: removing someone's last role
    // shuts them out of the admin CMS on their very next click.
    if (isAdminClient && grants.length === 0) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        "admin_access_required",
        "Admin access required",
        "This account has no role in the admin system.",
      );
    }
    if (required && !PermissionPolicyHelper.can(grants, required)) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        "forbidden",
        "Forbidden",
        "You don't have permission to do this.",
      );
    }
    return true;
  }
}
