import type { ISessionRow } from "../auth.types.js";

import { describe, expect, it } from "vitest";

import { SESSION_LIFETIME, SESSION_TOUCH_INTERVAL_MS } from "../auth.constants.js";
import { SessionPolicyHelper } from "./session-policy.helper.js";

const NOW = new Date("2026-11-09T10:00:00Z");

function session(overrides: Partial<ISessionRow> = {}): ISessionRow {
  return {
    id: "s1",
    userId: "u1",
    client: "web",
    lastSeenAt: NOW,
    ...SessionPolicyHelper.initialExpiry("web", NOW),
    ...overrides,
  };
}

describe("SessionPolicyHelper", () => {
  it("gives admin sessions a much shorter life than member sessions", () => {
    const admin = SessionPolicyHelper.initialExpiry("admin", NOW);
    const member = SessionPolicyHelper.initialExpiry("web", NOW);

    expect(admin.idleExpiresAt.getTime() - NOW.getTime()).toBe(SESSION_LIFETIME.admin.idleMs);
    expect(member.idleExpiresAt.getTime() - NOW.getTime()).toBe(SESSION_LIFETIME.member.idleMs);
    expect(admin.absoluteExpiresAt < member.absoluteExpiresAt).toBe(true);
  });

  it("treats mobile like a member session", () => {
    expect(SessionPolicyHelper.initialExpiry("mobile", NOW)).toEqual(
      SessionPolicyHelper.initialExpiry("web", NOW),
    );
  });

  it("expires on either the idle or the absolute limit", () => {
    const idle = session({ idleExpiresAt: NOW });
    const absolute = session({ absoluteExpiresAt: NOW });

    expect(SessionPolicyHelper.isExpired(idle, NOW)).toBe(true);
    expect(SessionPolicyHelper.isExpired(absolute, NOW)).toBe(true);
    expect(SessionPolicyHelper.isExpired(session(), NOW)).toBe(false);
  });

  it("touches at most once per interval", () => {
    const recent = session({ lastSeenAt: new Date(NOW.getTime() - SESSION_TOUCH_INTERVAL_MS + 1) });
    const stale = session({ lastSeenAt: new Date(NOW.getTime() - SESSION_TOUCH_INTERVAL_MS) });

    expect(SessionPolicyHelper.needsTouch(recent, NOW)).toBe(false);
    expect(SessionPolicyHelper.needsTouch(stale, NOW)).toBe(true);
  });

  it("never extends the idle expiry past the absolute cap", () => {
    const nearCap = session({ absoluteExpiresAt: new Date(NOW.getTime() + 1_000) });

    expect(SessionPolicyHelper.extendedIdleExpiry(nearCap, NOW)).toEqual(nearCap.absoluteExpiresAt);
  });
});
