import type { ISessionRow, TAuthClient } from "../auth.types.js";

import { SESSION_LIFETIME, SESSION_TOUCH_INTERVAL_MS } from "../auth.constants.js";

export interface ISessionExpiry {
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export class SessionPolicyHelper {
  static initialExpiry(client: TAuthClient, now: Date): ISessionExpiry {
    const lifetime = SessionPolicyHelper.lifetime(client);
    return {
      idleExpiresAt: new Date(now.getTime() + lifetime.idleMs),
      absoluteExpiresAt: new Date(now.getTime() + lifetime.absoluteMs),
    };
  }

  static isExpired(session: ISessionRow, now: Date): boolean {
    return session.idleExpiresAt <= now || session.absoluteExpiresAt <= now;
  }

  static needsTouch(session: ISessionRow, now: Date): boolean {
    return now.getTime() - session.lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS;
  }

  static extendedIdleExpiry(session: ISessionRow, now: Date): Date {
    const extended = now.getTime() + SessionPolicyHelper.lifetime(session.client).idleMs;
    return new Date(Math.min(extended, session.absoluteExpiresAt.getTime()));
  }

  private static lifetime(client: TAuthClient) {
    return client === "admin" ? SESSION_LIFETIME.admin : SESSION_LIFETIME.member;
  }
}
