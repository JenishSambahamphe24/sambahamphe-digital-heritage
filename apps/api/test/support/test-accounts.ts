import type { TestStack } from "./test-stack.js";
import type { App } from "supertest/types.js";

import request from "supertest";

import { RoleAssignmentsService } from "../../src/modules/access/application/role-assignments.service.js";
import { TEST_ADMIN_ORIGIN, TEST_WEB_ORIGIN } from "./test-env.js";
import { TestMailbox } from "./test-mailbox.js";

export const TEST_PASSWORD = "correct horse battery";
const API = "/api/v1";

let sequence = 0;

export interface ITestAccount {
  id: string;
  email: string;
}

export class TestAccounts {
  static freshIp(): string {
    sequence += 1;
    return `198.51.100.${sequence % 250}`;
  }

  static async createVerified(stack: TestStack, server: App, label: string): Promise<ITestAccount> {
    sequence += 1;
    const email = `${label}-${Date.now()}-${sequence}@example.com`;
    const ip = TestAccounts.freshIp();
    await request(server)
      .post(`${API}/auth/register`)
      .set("Origin", TEST_WEB_ORIGIN)
      .set("X-Forwarded-For", ip)
      .send({ email, password: TEST_PASSWORD, displayName: label })
      .expect(202);
    const mail = await stack.mailbox.waitFor(email, "Confirm your email");
    await request(server)
      .post(`${API}/auth/verify-email`)
      .set("Origin", TEST_WEB_ORIGIN)
      .set("X-Forwarded-For", ip)
      .send({ token: TestMailbox.tokenFrom(mail) })
      .expect(204);
    const [row] = await stack.database.query<{ id: string }>(
      `select id from users where email = '${email}'`,
    );
    if (!row) {
      throw new Error("registered user not found");
    }
    return { id: row.id, email };
  }

  static async adminLogin(server: App, account: ITestAccount): Promise<request.Response> {
    return request(server)
      .post(`${API}/auth/login`)
      .set("Origin", TEST_ADMIN_ORIGIN)
      .set("X-Client", "admin")
      .set("X-Forwarded-For", TestAccounts.freshIp())
      .send({ email: account.email, password: TEST_PASSWORD });
  }

  // A verified account holding one global role, signed in to the admin.
  static async withRole(
    stack: TestStack,
    server: App,
    label: string,
    roleKey: string,
  ): Promise<ITestAccount & { cookie: string }> {
    const account = await TestAccounts.createVerified(stack, server, label);
    await stack.app
      .get(RoleAssignmentsService)
      .assign(null, { userId: account.id, roleKey, scopeType: "global" });
    const response = await TestAccounts.adminLogin(server, account);
    return { ...account, cookie: TestAccounts.adminCookie(response) };
  }

  static adminCookie(response: request.Response): string {
    const header = response.headers["set-cookie"] as unknown as string[] | undefined;
    const cookie = header?.find((value) => value.startsWith("admin_sid="))?.split(";")[0];
    if (!cookie) {
      throw new Error("admin login did not set admin_sid");
    }
    return cookie;
  }

  static admin(server: App, cookie: string) {
    const withHeaders = (test: request.Test) =>
      test.set("Origin", TEST_ADMIN_ORIGIN).set("X-Client", "admin").set("Cookie", cookie);
    return {
      get: (path: string) => withHeaders(request(server).get(`${API}${path}`)),
      post: (path: string) => withHeaders(request(server).post(`${API}${path}`)),
      patch: (path: string) => withHeaders(request(server).patch(`${API}${path}`)),
      delete: (path: string) => withHeaders(request(server).delete(`${API}${path}`)),
    };
  }
}
