import type { IGrant } from "../access.types.js";

import { describe, expect, it } from "vitest";

import { PermissionPolicyHelper } from "./permission-policy.helper.js";

const KOSHI = "11111111-1111-4111-8111-111111111111";
const KOSHI_GAAU = "22222222-2222-4222-8222-222222222222";
const BAGMATI = "33333333-3333-4333-8333-333333333333";

function grant(overrides: Partial<IGrant>): IGrant {
  return {
    roleKey: "admin",
    permissionKey: "role:assign",
    scopeType: "global",
    orgUnitId: null,
    branchId: null,
    ...overrides,
  };
}

describe("PermissionPolicyHelper.can", () => {
  it("allows a global grant everywhere", () => {
    const grants = [grant({})];

    expect(PermissionPolicyHelper.can(grants, "role:assign")).toBe(true);
    expect(PermissionPolicyHelper.can(grants, "role:assign", { orgUnitPath: [KOSHI] })).toBe(true);
  });

  it("denies a permission the user doesn't hold", () => {
    expect(PermissionPolicyHelper.can([grant({})], "audit:read")).toBe(false);
    expect(PermissionPolicyHelper.can([], "audit:read")).toBe(false);
  });

  it("lets super admin do anything, but only as a global grant", () => {
    const superAdmin = grant({ roleKey: "super_admin", permissionKey: null });
    const scopedSuperAdmin = grant({
      roleKey: "super_admin",
      permissionKey: null,
      scopeType: "org_unit",
      orgUnitId: KOSHI,
    });

    expect(PermissionPolicyHelper.can([superAdmin], "anything:at_all")).toBe(true);
    expect(PermissionPolicyHelper.can([scopedSuperAdmin], "anything:at_all")).toBe(false);
  });

  it("applies a unit grant to that unit and its descendants only", () => {
    const koshiManager = [
      grant({
        roleKey: "org_manager",
        permissionKey: "appointment:create",
        scopeType: "org_unit",
        orgUnitId: KOSHI,
      }),
    ];

    expect(
      PermissionPolicyHelper.can(koshiManager, "appointment:create", {
        orgUnitPath: [KOSHI_GAAU, KOSHI],
      }),
    ).toBe(true);
    expect(
      PermissionPolicyHelper.can(koshiManager, "appointment:create", { orgUnitPath: [BAGMATI] }),
    ).toBe(false);
  });

  it("never lets a scoped grant pass an unscoped check", () => {
    const koshiManager = [
      grant({
        roleKey: "org_manager",
        permissionKey: "appointment:create",
        scopeType: "org_unit",
        orgUnitId: KOSHI,
      }),
    ];

    expect(PermissionPolicyHelper.can(koshiManager, "appointment:create")).toBe(false);
  });

  it("keeps branch and unit scopes separate", () => {
    const branchEditor = [
      grant({
        roleKey: "genealogy_editor",
        permissionKey: "person:update",
        scopeType: "branch",
        branchId: KOSHI,
      }),
    ];

    expect(
      PermissionPolicyHelper.can(branchEditor, "person:update", { orgUnitPath: [KOSHI] }),
    ).toBe(false);
    expect(PermissionPolicyHelper.can(branchEditor, "person:update", { branchPath: [KOSHI] })).toBe(
      true,
    );
  });
});
