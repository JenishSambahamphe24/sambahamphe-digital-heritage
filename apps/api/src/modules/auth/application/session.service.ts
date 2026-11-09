import type { IAuthContext, IRequestMeta, TAuthClient } from "../auth.types.js";
import type { TSessionRow } from "../internal/sessions.repository.js";

import { Injectable } from "@nestjs/common";

import { AppConfig } from "../../../core/config/app-config.js";
import { IpHashHelper } from "../../../core/security/ip-hash.helper.js";
import { SessionPolicyHelper } from "../domain/session-policy.helper.js";
import { TokenHelper } from "../domain/token.helper.js";
import { SessionsRepository } from "../internal/sessions.repository.js";

export interface ICreatedSession {
  token: string;
  session: TSessionRow;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly config: AppConfig,
  ) {}

  async create(userId: string, client: TAuthClient, meta: IRequestMeta): Promise<ICreatedSession> {
    const now = new Date();
    const token = TokenHelper.generate();
    const session = await this.sessions.insert({
      userId,
      client,
      tokenHash: TokenHelper.hash(token),
      userAgent: meta.userAgent,
      ipHash: IpHashHelper.hash(meta.ip, this.config.ipHashSecret),
      lastSeenAt: now,
      ...SessionPolicyHelper.initialExpiry(client, now),
    });
    return { token, session };
  }

  async authenticate(token: string, client: TAuthClient): Promise<IAuthContext | null> {
    const now = new Date();
    const active = await this.sessions.findActiveByTokenHash(TokenHelper.hash(token), client, now);
    if (!active) {
      return null;
    }
    if (SessionPolicyHelper.needsTouch(active.session, now)) {
      const idleExpiresAt = SessionPolicyHelper.extendedIdleExpiry(active.session, now);
      await this.sessions.touch(active.session.id, now, idleExpiresAt);
    }
    return { user: active.user, session: active.session, client };
  }

  revoke(sessionId: string, userId: string, reason: string): Promise<boolean> {
    return this.sessions.revoke(sessionId, userId, reason);
  }

  listActive(userId: string): Promise<TSessionRow[]> {
    return this.sessions.listActiveForUser(userId, new Date());
  }
}
