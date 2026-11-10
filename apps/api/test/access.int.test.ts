import type { ITestAccount } from "./support/test-accounts.js";
import type { App } from "supertest/types.js";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { RoleAssignmentsService } from "../src/modules/access/application/role-assignments.service.js";
import { TestAccounts } from "./support/test-accounts.js";
import { TestStack } from "./support/test-stack.js";

let stack: TestStack;
let server: App;
let owner: ITestAccount;
let ownerCookie: string;

function assign(cookie: string, body: Record<string, unknown>) {
  return TestAccounts.admin(server, cookie).post("/admin/role-assignments").send(body);
}

async function loginAsAdmin(account: ITestAccount): Promise<string> {
  const response = await TestAccounts.adminLogin(server, account);
  expect(response.status).toBe(200);
  return TestAccounts.adminCookie(response);
}

beforeAll(async () => {
  stack = await TestStack.start();
  server = stack.app.getHttpServer();
  owner = await TestAccounts.createVerified(stack, server, "owner");
  await stack.app.get(RoleAssignmentsService).bootstrapSuperAdmin(owner.email);
  ownerCookie = await loginAsAdmin(owner);
});

afterAll(async () => {
  await stack?.stop();
});

describe("catalog and bootstrap", () => {
  it("syncs system roles and their permissions at startup", async () => {
    const response = await TestAccounts.admin(server, ownerCookie).get("/admin/roles").expect(200);
    const roles = response.body.data as Array<{
      key: string;
      permissions: string[];
      isSystem: boolean;
    }>;

    expect(roles.map((role) => role.key).sort()).toEqual([
      "admin",
      "content_editor",
      "contributor",
      "genealogy_editor",
      "media_manager",
      "org_manager",
      "super_admin",
    ]);
    expect(roles.find((role) => role.key === "admin")?.permissions).toEqual([
      "audit:read",
      "role:assign",
      "role:read",
      "user:read",
    ]);
    expect(roles.every((role) => role.isSystem)).toBe(true);
  });

  it("refuses a second bootstrap once a super admin exists", async () => {
    const other = await TestAccounts.createVerified(stack, server, "late");
    await expect(
      stack.app.get(RoleAssignmentsService).bootstrapSuperAdmin(other.email),
    ).rejects.toThrow(/already exists/);
  });
});

describe("who may enter the admin system", () => {
  it("refuses admin login to a member without any role", async () => {
    const member = await TestAccounts.createVerified(stack, server, "member");
    const response = await TestAccounts.adminLogin(server, member);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("admin_access_required");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("requires the specific permission, not just any role", async () => {
    const contributor = await TestAccounts.createVerified(stack, server, "contributor");
    await assign(ownerCookie, {
      userId: contributor.id,
      roleKey: "contributor",
      scopeType: "global",
    }).expect(201);
    const cookie = await loginAsAdmin(contributor);

    await TestAccounts.admin(server, cookie).get("/me").expect(200);
    const users = await TestAccounts.admin(server, cookie).get("/admin/users").expect(403);
    expect(users.body.code).toBe("forbidden");
  });
});

describe("assigning and revoking roles", () => {
  let admin: ITestAccount;
  let adminCookie: string;
  let adminAssignmentId: string;

  beforeAll(async () => {
    admin = await TestAccounts.createVerified(stack, server, "admin");
    const assigned = await assign(ownerCookie, {
      userId: admin.id,
      roleKey: "admin",
      scopeType: "global",
    });
    expect(assigned.status).toBe(201);
    adminAssignmentId = assigned.body.id as string;
    adminCookie = await loginAsAdmin(admin);
  });

  it("lets an admin list users with paging", async () => {
    const response = await TestAccounts.admin(server, adminCookie)
      .get(`/admin/users?q=${encodeURIComponent(admin.email)}&pageSize=5`)
      .expect(200);

    expect(response.body.page).toEqual({ page: 1, pageSize: 5, total: 1 });
    expect(response.body.data[0]).toMatchObject({ email: admin.email, emailVerified: true });
    expect(response.body.data[0]).not.toHaveProperty("passwordHash");
  });

  it("lets an admin open one user, and answers 404 for an unknown id", async () => {
    const found = await TestAccounts.admin(server, adminCookie)
      .get(`/admin/users/${admin.id}`)
      .expect(200);
    expect(found.body).toMatchObject({ id: admin.id, email: admin.email, status: "active" });

    const missing = await TestAccounts.admin(server, adminCookie)
      .get("/admin/users/00000000-0000-4000-8000-000000000000")
      .expect(404);
    expect(missing.body.code).toBe("not_found");
  });

  it("only a super admin can grant super admin", async () => {
    const target = await TestAccounts.createVerified(stack, server, "target");
    const response = await assign(adminCookie, {
      userId: target.id,
      roleKey: "super_admin",
      scopeType: "global",
    });

    expect(response.status).toBe(403);
  });

  it("rejects a duplicate active grant", async () => {
    const response = await assign(ownerCookie, {
      userId: admin.id,
      roleKey: "admin",
      scopeType: "global",
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("already_assigned");
  });

  it("validates the scope shape", async () => {
    const response = await assign(ownerCookie, {
      userId: admin.id,
      roleKey: "org_manager",
      scopeType: "org_unit",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("validation_error");
  });

  it("refuses roles for unverified accounts", async () => {
    const [row] = await stack.database.query<{ id: string }>(
      "insert into users (id, email, display_name) values (gen_random_uuid(), 'unverified-" +
        Date.now() +
        "@example.com', 'U') returning id",
    );
    const response = await assign(ownerCookie, {
      userId: row?.id,
      roleKey: "contributor",
      scopeType: "global",
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("user_not_verified");
  });

  it("revoking the last role locks the person out on their next request", async () => {
    await TestAccounts.admin(server, adminCookie).get("/admin/users").expect(200);

    await TestAccounts.admin(server, ownerCookie)
      .delete(`/admin/role-assignments/${adminAssignmentId}`)
      .expect(204);

    const after = await TestAccounts.admin(server, adminCookie).get("/admin/users").expect(403);
    expect(after.body.code).toBe("admin_access_required");
  });
});

describe("protecting the last super admin", () => {
  it("cannot remove the only super admin", async () => {
    const [row] = await stack.database.query<{ id: string }>(
      `select ra.id from role_assignments ra join roles r on r.id = ra.role_id
       where r.key = 'super_admin' and ra.revoked_at is null`,
    );
    const response = await TestAccounts.admin(server, ownerCookie).delete(
      `/admin/role-assignments/${row?.id}`,
    );

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("last_super_admin");
  });
});

describe("audit log", () => {
  it("records role changes with the acting user, without personal data", async () => {
    const response = await TestAccounts.admin(server, ownerCookie)
      .get("/admin/audit-log?action=role.assigned&limit=100")
      .expect(200);
    const entries = response.body.data as Array<{
      actorId: string;
      changes: Record<string, unknown>;
      requestId: string;
    }>;

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.actorId === owner.id)).toBe(true);
    expect(entries[0]?.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(entries)).not.toContain("@example.com");
  });

  it("records failed logins without the attempted email", async () => {
    const email = `nobody-${Date.now()}@example.com`;
    await TestAccounts.adminLogin(server, { id: "", email });
    const response = await TestAccounts.admin(server, ownerCookie)
      .get("/admin/audit-log?action=auth.login_failed&limit=100")
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body)).not.toContain(email);
  });

  it("pages with an opaque cursor", async () => {
    const first = await TestAccounts.admin(server, ownerCookie)
      .get("/admin/audit-log?limit=2")
      .expect(200);
    const cursor = first.body.page.nextCursor as string;
    const second = await TestAccounts.admin(server, ownerCookie)
      .get(`/admin/audit-log?limit=2&cursor=${cursor}`)
      .expect(200);

    const firstIds = (first.body.data as Array<{ id: number }>).map((entry) => entry.id);
    const secondIds = (second.body.data as Array<{ id: number }>).map((entry) => entry.id);
    expect(Math.min(...firstIds)).toBeGreaterThan(Math.max(...secondIds));
  });

  it("cannot be altered, even directly in the database", async () => {
    await expect(stack.database.query("update audit_log set action = 'tampered'")).rejects.toThrow(
      /append-only/,
    );
    await expect(stack.database.query("delete from audit_log")).rejects.toThrow(/append-only/);
  });
});
