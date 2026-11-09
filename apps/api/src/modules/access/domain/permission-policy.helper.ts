import type { IGrant, IResourceScope } from "../access.types.js";

import { SUPER_ADMIN_ROLE } from "../access.catalog.js";

export class PermissionPolicyHelper {
  static isSuperAdmin(grants: readonly IGrant[]): boolean {
    return grants.some(
      (grant) => grant.roleKey === SUPER_ADMIN_ROLE && grant.scopeType === "global",
    );
  }

  // Without a resource scope only global grants count: a board-limited editor
  // must never pass a check that isn't about their board.
  static can(grants: readonly IGrant[], permission: string, scope?: IResourceScope): boolean {
    if (PermissionPolicyHelper.isSuperAdmin(grants)) {
      return true;
    }
    return grants.some(
      (grant) => grant.permissionKey === permission && PermissionPolicyHelper.covers(grant, scope),
    );
  }

  private static covers(grant: IGrant, scope: IResourceScope | undefined): boolean {
    switch (grant.scopeType) {
      case "global":
        return true;
      case "org_unit":
        return grant.orgUnitId !== null && (scope?.orgUnitPath?.includes(grant.orgUnitId) ?? false);
      case "branch":
        return grant.branchId !== null && (scope?.branchPath?.includes(grant.branchId) ?? false);
    }
  }
}
