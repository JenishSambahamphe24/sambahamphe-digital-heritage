import type { TAssignmentRow } from "../internal/access.repository.js";
import type { TAssignRoleRequest } from "@repo/contracts";

import { HttpStatus, Injectable } from "@nestjs/common";

import { AuditService } from "../../../core/audit/audit.service.js";
import { DatabaseErrorHelper } from "../../../core/database/database-error.helper.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { UsersRepository } from "../../users/users.repository.js";
import { SUPER_ADMIN_ROLE } from "../access.catalog.js";
import { PermissionPolicyHelper } from "../domain/permission-policy.helper.js";
import { AccessRepository } from "../internal/access.repository.js";
import { AccessService } from "./access.service.js";

const MIN_SUPER_ADMINS = 1;

@Injectable()
export class RoleAssignmentsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly access: AccessRepository,
    private readonly accessService: AccessService,
    private readonly users: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async assign(actorId: string | null, request: TAssignRoleRequest): Promise<TAssignmentRow> {
    const role = await this.access.findRoleByKey(request.roleKey);
    if (!role) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "unknown_role",
        "Unknown role",
        "No such role.",
      );
    }
    if (role.key === SUPER_ADMIN_ROLE) {
      await this.requireSuperAdmin(actorId);
      if (request.scopeType !== "global") {
        throw new AppException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "invalid_scope",
          "Invalid scope",
          "Super administrator can only be granted globally.",
        );
      }
    }

    const user = await this.users.findById(request.userId);
    if (!user || user.status !== "active") {
      throw new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "User not found.");
    }
    if (!user.emailVerifiedAt) {
      throw new AppException(
        HttpStatus.CONFLICT,
        "user_not_verified",
        "Email not verified",
        "Staff roles can only be given to users with a verified email.",
      );
    }

    try {
      return await this.database.db.transaction(async (tx) => {
        const assignment = await this.access.insertAssignment(
          {
            userId: user.id,
            roleId: role.id,
            scopeType: request.scopeType,
            orgUnitId: request.scopeType === "org_unit" ? request.orgUnitId : null,
            branchId: request.scopeType === "branch" ? request.branchId : null,
            grantedBy: actorId,
            expiresAt: request.expiresAt ? new Date(request.expiresAt) : null,
          },
          tx,
        );
        await this.audit.record(
          {
            action: "role.assigned",
            entityType: "role_assignment",
            entityId: assignment.id,
            actorId,
            changes: { userId: user.id, role: role.key, scopeType: request.scopeType },
          },
          tx,
        );
        return assignment;
      });
    } catch (error) {
      if (DatabaseErrorHelper.isUniqueViolation(error)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "already_assigned",
          "Already assigned",
          "The user already holds this role in this scope.",
        );
      }
      throw error;
    }
  }

  async revoke(actorId: string, assignmentId: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      const now = new Date();
      const found = await this.access.findActiveAssignment(assignmentId, now, tx);
      if (!found) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          "not_found",
          "Not found",
          "Role assignment not found.",
        );
      }
      if (found.roleKey === SUPER_ADMIN_ROLE) {
        await this.requireSuperAdmin(actorId);
        if ((await this.access.lockActiveSuperAdminCount(now, tx)) <= MIN_SUPER_ADMINS) {
          throw new AppException(
            HttpStatus.CONFLICT,
            "last_super_admin",
            "Last super administrator",
            "Appoint another super administrator before removing the last one.",
          );
        }
      }
      await this.access.revokeAssignment(found.assignment.id, actorId, tx);
      await this.audit.record(
        {
          action: "role.revoked",
          entityType: "role_assignment",
          entityId: found.assignment.id,
          actorId,
          changes: { userId: found.assignment.userId, role: found.roleKey },
        },
        tx,
      );
    });
  }

  // Only for the very first super administrator (no admin exists to appoint one).
  // Check and insert share one transaction holding the lock, so two
  // simultaneous runs can't both succeed.
  async bootstrapSuperAdmin(email: string): Promise<TAssignmentRow> {
    const role = await this.access.findRoleByKey(SUPER_ADMIN_ROLE);
    if (!role) {
      throw new Error("Roles not synced: start the API once, or run the catalog sync first.");
    }
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user || user.status !== "active" || !user.emailVerifiedAt) {
      throw new Error(
        "No active user with a verified email has that address. Register and verify first.",
      );
    }
    return this.database.db.transaction(async (tx) => {
      if ((await this.access.lockActiveSuperAdminCount(new Date(), tx)) > 0) {
        throw new Error(
          "A super administrator already exists. Use the admin CMS to appoint others.",
        );
      }
      const assignment = await this.access.insertAssignment(
        {
          userId: user.id,
          roleId: role.id,
          scopeType: "global",
          orgUnitId: null,
          branchId: null,
          grantedBy: null,
          expiresAt: null,
        },
        tx,
      );
      await this.audit.record(
        {
          action: "role.bootstrap_super_admin",
          entityType: "role_assignment",
          entityId: assignment.id,
          changes: { userId: user.id, role: SUPER_ADMIN_ROLE },
        },
        tx,
      );
      return assignment;
    });
  }

  private async requireSuperAdmin(actorId: string | null): Promise<void> {
    const grants = actorId ? await this.accessService.grantsFor(actorId) : [];
    if (!PermissionPolicyHelper.isSuperAdmin(grants)) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        "forbidden",
        "Forbidden",
        "Only a super administrator can grant or remove super administrator.",
      );
    }
  }
}
