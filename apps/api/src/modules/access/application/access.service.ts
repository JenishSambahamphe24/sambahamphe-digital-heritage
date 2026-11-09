import type { IGrant, IResourceScope } from "../access.types.js";
import type { Request } from "express";

import { Injectable } from "@nestjs/common";

import { PermissionPolicyHelper } from "../domain/permission-policy.helper.js";
import { AccessRepository } from "../internal/access.repository.js";

@Injectable()
export class AccessService {
  constructor(private readonly access: AccessRepository) {}

  grantsFor(userId: string): Promise<IGrant[]> {
    return this.access.grantsForUser(userId, new Date());
  }

  // Loaded once per request and reused by the guard and any service check.
  async grantsForRequest(request: Request): Promise<IGrant[]> {
    if (!request.auth) {
      return [];
    }
    request.grants ??= await this.grantsFor(request.auth.user.id);
    return request.grants;
  }

  async hasAnyRole(userId: string): Promise<boolean> {
    return (await this.grantsFor(userId)).length > 0;
  }

  async can(request: Request, permission: string, scope?: IResourceScope): Promise<boolean> {
    return PermissionPolicyHelper.can(await this.grantsForRequest(request), permission, scope);
  }
}
