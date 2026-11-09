export type TScopeType = "global" | "org_unit" | "branch";

export interface IGrant {
  roleKey: string;
  permissionKey: string | null;
  scopeType: TScopeType;
  orgUnitId: string | null;
  branchId: string | null;
}

// The scope path of the resource being acted on: its unit (or branch) plus
// all ancestors, so a grant on a parent unit covers its children.
export interface IResourceScope {
  orgUnitPath?: readonly string[];
  branchPath?: readonly string[];
}
