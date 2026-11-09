import type { TDbExecutor } from "../../../core/database/database.types.js";
import type { TUserRow } from "../../users/users.repository.js";
import type { ISessionRow, TAuthClient } from "../auth.types.js";

import { Injectable } from "@nestjs/common";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { authSessions, users } from "../../../core/database/schema/index.js";

export type TSessionRow = typeof authSessions.$inferSelect;
export type TNewSessionRow = typeof authSessions.$inferInsert;

export interface IActiveSession {
  session: ISessionRow;
  user: TUserRow;
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly database: DatabaseService) {}

  async insert(values: TNewSessionRow): Promise<TSessionRow> {
    const [row] = await this.database.db.insert(authSessions).values(values).returning();
    if (!row) {
      throw new Error("Insert into auth_sessions returned no row");
    }
    return row;
  }

  async findActiveByTokenHash(
    tokenHash: string,
    client: TAuthClient,
    now: Date,
  ): Promise<IActiveSession | null> {
    const [row] = await this.database.db
      .select({ session: authSessions, user: users })
      .from(authSessions)
      .innerJoin(users, eq(users.id, authSessions.userId))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          eq(authSessions.client, client),
          isNull(authSessions.revokedAt),
          gt(authSessions.idleExpiresAt, now),
          gt(authSessions.absoluteExpiresAt, now),
          eq(users.status, "active"),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async touch(id: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void> {
    await this.database.db
      .update(authSessions)
      .set({ lastSeenAt, idleExpiresAt })
      .where(eq(authSessions.id, id));
  }

  async revoke(id: string, userId: string, reason: string): Promise<boolean> {
    const revoked = await this.database.db
      .update(authSessions)
      .set({ revokedAt: new Date(), revokedReason: reason })
      .where(
        and(
          eq(authSessions.id, id),
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
        ),
      )
      .returning({ id: authSessions.id });
    return revoked.length > 0;
  }

  async revokeAllForUser(
    userId: string,
    reason: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<void> {
    await executor
      .update(authSessions)
      .set({ revokedAt: new Date(), revokedReason: reason })
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }

  async listActiveForUser(userId: string, now: Date): Promise<TSessionRow[]> {
    return this.database.db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.idleExpiresAt, now),
          gt(authSessions.absoluteExpiresAt, now),
        ),
      )
      .orderBy(desc(authSessions.lastSeenAt));
  }
}
