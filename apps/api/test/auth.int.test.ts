import type { App } from "supertest/types.js";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AUTH_RATE_LIMIT } from "../src/modules/auth/auth.constants.js";
import { TEST_ADMIN_ORIGIN, TEST_WEB_ORIGIN } from "./support/test-env.js";
import { TestMailbox } from "./support/test-mailbox.js";
import { TestStack } from "./support/test-stack.js";

const PASSWORD = "correct horse battery";
const NEW_PASSWORD = "staple paper clip 42";
const API = "/api/v1";

let stack: TestStack;
let server: App;
let ipCounter = 0;

function freshIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${ipCounter}@example.com`;
}

function web(ip: string) {
  return {
    post: (path: string) =>
      request(server)
        .post(`${API}${path}`)
        .set("Origin", TEST_WEB_ORIGIN)
        .set("X-Forwarded-For", ip),
    get: (path: string) => request(server).get(`${API}${path}`).set("X-Forwarded-For", ip),
    delete: (path: string) =>
      request(server)
        .delete(`${API}${path}`)
        .set("Origin", TEST_WEB_ORIGIN)
        .set("X-Forwarded-For", ip),
  };
}

function cookieFrom(response: request.Response, name: string): string | null {
  const header = response.headers["set-cookie"] as unknown as string[] | undefined;
  const cookie = header?.find((value) => value.startsWith(`${name}=`));
  return cookie ? (cookie.split(";")[0] ?? null) : null;
}

async function registerAndVerify(email: string, ip: string): Promise<void> {
  await web(ip)
    .post("/auth/register")
    .send({ email, password: PASSWORD, displayName: "Test User" })
    .expect(202);
  const mail = await stack.mailbox.waitFor(email, "Confirm your email");
  await web(ip)
    .post("/auth/verify-email")
    .send({ token: TestMailbox.tokenFrom(mail) })
    .expect(204);
}

async function loginWeb(email: string, ip: string, password = PASSWORD): Promise<string> {
  const response = await web(ip).post("/auth/login").send({ email, password }).expect(200);
  const cookie = cookieFrom(response, "sid");
  if (!cookie) {
    throw new Error("login did not set the sid cookie");
  }
  return cookie;
}

beforeAll(async () => {
  stack = await TestStack.start();
  server = stack.app.getHttpServer();
});

afterAll(async () => {
  await stack?.stop();
});

describe("registration and email verification", () => {
  it("register → email → verify → login → /me", async () => {
    const ip = freshIp();
    const email = uniqueEmail("ram");

    const registered = await web(ip)
      .post("/auth/register")
      .send({
        email: `  ${email.toUpperCase()} `,
        password: PASSWORD,
        displayName: "Ram Sambahamphe",
      })
      .expect(202);
    expect(registered.body).toEqual({ status: "check_email" });

    const mail = await stack.mailbox.waitFor(email, "Confirm your email");
    expect(mail.text).toContain("Namaste Ram Sambahamphe,");
    await web(ip)
      .post("/auth/verify-email")
      .send({ token: TestMailbox.tokenFrom(mail) })
      .expect(204);

    const login = await web(ip).post("/auth/login").send({ email, password: PASSWORD }).expect(200);
    const setCookie = (login.headers["set-cookie"] as unknown as string[]).join(";");
    expect(setCookie).toMatch(/sid=[\w-]+/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(login.body).not.toHaveProperty("sessionToken");

    const me = await web(ip)
      .get("/me")
      .set("Cookie", cookieFrom(login, "sid") ?? "")
      .expect(200);
    expect(me.body).toMatchObject({ email, emailVerified: true, displayName: "Ram Sambahamphe" });
    expect(me.body).not.toHaveProperty("passwordHash");
  });

  it("answers identically for an existing email and tells the owner instead", async () => {
    const ip = freshIp();
    const email = uniqueEmail("taken");
    await registerAndVerify(email, ip);

    const again = await web(ip)
      .post("/auth/register")
      .send({ email, password: "another password 1", displayName: "Impostor" })
      .expect(202);
    expect(again.body).toEqual({ status: "check_email" });

    await stack.mailbox.waitFor(email, "Someone tried to sign up");
    const rows = await stack.database.query<{ count: string }>(
      `select count(*)::text as count from users where email = '${email}'`,
    );
    expect(rows[0]?.count).toBe("1");
  });

  it("accepts a verification link only once", async () => {
    const ip = freshIp();
    const email = uniqueEmail("once");
    await web(ip)
      .post("/auth/register")
      .send({ email, password: PASSWORD, displayName: "Once" })
      .expect(202);
    const token = TestMailbox.tokenFrom(await stack.mailbox.waitFor(email, "Confirm your email"));

    await web(ip).post("/auth/verify-email").send({ token }).expect(204);
    const second = await web(ip).post("/auth/verify-email").send({ token }).expect(400);
    expect(second.body.code).toBe("invalid_token");
  });

  it("returns field errors for invalid input", async () => {
    const response = await web(freshIp())
      .post("/auth/register")
      .send({ email: "not-an-email", password: "short", displayName: "" })
      .expect(422);

    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body.code).toBe("validation_error");
    const paths = (response.body.errors as Array<{ path: string[] }>).map((error) => error.path[0]);
    expect(paths.sort()).toEqual(["displayName", "email", "password"]);
  });
});

describe("login and sessions", () => {
  it("rejects a wrong password and an unknown email the same way", async () => {
    const ip = freshIp();
    const email = uniqueEmail("creds");
    await registerAndVerify(email, ip);

    const wrong = await web(ip)
      .post("/auth/login")
      .send({ email, password: "wrong password!" })
      .expect(401);
    const unknown = await web(ip)
      .post("/auth/login")
      .send({ email: uniqueEmail("nobody"), password: PASSWORD })
      .expect(401);

    expect(wrong.body.code).toBe("invalid_credentials");
    expect(unknown.body).toMatchObject({ code: wrong.body.code, detail: wrong.body.detail });
  });

  it("requires a session for /me", async () => {
    const response = await web(freshIp()).get("/me").expect(401);
    expect(response.body.code).toBe("unauthenticated");
  });

  it("logout revokes the session immediately", async () => {
    const ip = freshIp();
    const email = uniqueEmail("logout");
    await registerAndVerify(email, ip);
    const cookie = await loginWeb(email, ip);

    const logout = await web(ip).post("/auth/logout").set("Cookie", cookie).expect(204);
    expect((logout.headers["set-cookie"] as unknown as string[]).join(";")).toMatch(/sid=;/);

    await web(ip).get("/me").set("Cookie", cookie).expect(401);
  });

  it("gives mobile a bearer token instead of a cookie", async () => {
    const ip = freshIp();
    const email = uniqueEmail("mobile");
    await registerAndVerify(email, ip);

    const login = await request(server)
      .post(`${API}/auth/login`)
      .set("X-Client", "mobile")
      .set("X-Forwarded-For", ip)
      .send({ email, password: PASSWORD })
      .expect(200);
    expect(login.headers["set-cookie"]).toBeUndefined();
    const token = login.body.sessionToken as string;
    expect(token).toMatch(/^[\w-]{43}$/);

    await request(server)
      .get(`${API}/me`)
      .set("X-Client", "mobile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("keeps admin and public sessions apart", async () => {
    const ip = freshIp();
    const email = uniqueEmail("admin");
    await registerAndVerify(email, ip);

    const login = await request(server)
      .post(`${API}/auth/login`)
      .set("Origin", TEST_ADMIN_ORIGIN)
      .set("X-Client", "admin")
      .set("X-Forwarded-For", ip)
      .send({ email, password: PASSWORD })
      .expect(200);
    const adminCookie = cookieFrom(login, "admin_sid");
    expect(adminCookie).not.toBeNull();
    expect(cookieFrom(login, "sid")).toBeNull();

    await request(server)
      .get(`${API}/me`)
      .set("X-Client", "admin")
      .set("Cookie", adminCookie ?? "")
      .expect(200);
    // The admin token presented as a public-site cookie is not accepted.
    const asWeb = (adminCookie ?? "").replace("admin_sid=", "sid=");
    await web(ip).get("/me").set("Cookie", asWeb).expect(401);
  });

  it("lists own sessions and revokes another device", async () => {
    const ip = freshIp();
    const email = uniqueEmail("devices");
    await registerAndVerify(email, ip);
    const laptop = await loginWeb(email, ip);
    const phone = await loginWeb(email, ip);

    const list = await web(ip).get("/me/sessions").set("Cookie", laptop).expect(200);
    const sessions = list.body.data as Array<{ id: string; current: boolean }>;
    expect(sessions).toHaveLength(2);
    const other = sessions.find((session) => !session.current);

    await web(ip).delete(`/me/sessions/${other?.id}`).set("Cookie", laptop).expect(204);
    await web(ip).get("/me").set("Cookie", phone).expect(401);
    await web(ip).get("/me").set("Cookie", laptop).expect(200);
  });
});

describe("password reset", () => {
  it("resets the password and signs out every session", async () => {
    const ip = freshIp();
    const email = uniqueEmail("reset");
    await registerAndVerify(email, ip);
    const oldSession = await loginWeb(email, ip);

    await web(ip).post("/auth/password-reset").send({ email }).expect(202);
    const mail = await stack.mailbox.waitFor(email, "Reset your password");
    await web(ip)
      .post("/auth/password-reset/confirm")
      .send({ token: TestMailbox.tokenFrom(mail), newPassword: NEW_PASSWORD })
      .expect(204);

    await web(ip).get("/me").set("Cookie", oldSession).expect(401);
    await web(ip).post("/auth/login").send({ email, password: PASSWORD }).expect(401);
    await loginWeb(email, ip, NEW_PASSWORD);
  });

  it("answers the same for unknown emails and sends nothing", async () => {
    const ip = freshIp();
    const ghost = uniqueEmail("ghost");
    const response = await web(ip).post("/auth/password-reset").send({ email: ghost }).expect(202);
    expect(response.body).toEqual({ status: "check_email" });

    // Barrier: the outbox is processed in order, so once a later email has
    // arrived, anything the ghost request queued would have arrived too.
    const barrier = uniqueEmail("barrier");
    await web(ip)
      .post("/auth/register")
      .send({ email: barrier, password: PASSWORD, displayName: "B" });
    await stack.mailbox.waitFor(barrier, "Confirm your email");

    expect(await stack.mailbox.countTo(ghost)).toBe(0);
  });
});

describe("request hardening", () => {
  it("rejects writes from other sites", async () => {
    const response = await request(server)
      .post(`${API}/auth/login`)
      .set("Origin", "https://evil.example")
      .set("X-Forwarded-For", freshIp())
      .send({ email: "a@example.com", password: PASSWORD })
      .expect(403);
    expect(response.body.code).toBe("csrf_rejected");
  });

  it("rejects non-JSON bodies", async () => {
    const response = await web(freshIp())
      .post("/auth/login")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=a%40example.com&password=x")
      .expect(415);
    expect(response.body.code).toBe("unsupported_media_type");
  });

  it("rate-limits login attempts per client IP", async () => {
    const ip = freshIp();
    const attempt = () =>
      web(ip)
        .post("/auth/login")
        .send({ email: "nobody@example.com", password: "wrong password!" });

    for (let index = 0; index < AUTH_RATE_LIMIT.limit; index += 1) {
      await attempt().expect(401);
    }
    const blocked = await attempt().expect(429);
    expect(blocked.body.code).toBe("rate_limited");

    await web(freshIp())
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "x" })
      .expect(401);
  });
});
