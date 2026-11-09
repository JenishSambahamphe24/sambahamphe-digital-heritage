import type { TPermission } from "../access.catalog.js";

import { SetMetadata } from "@nestjs/common";

export const REQUIRED_PERMISSION_KEY = "access:requiredPermission";

// Checks a GLOBAL grant. Board- or branch-scoped checks belong in services,
// which know the resource's scope (AccessService.can with a scope).
export const RequirePermission = (permission: TPermission) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
