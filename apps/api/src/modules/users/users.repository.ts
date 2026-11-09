import type { TDbExecutor } from "../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DatabaseService } from "../../core/database/database.service.js";
import { users } from "../../core/database/schema/index.js";

export type TUserRow = typeof users.$inferSelect;
export type TNewUserRow = typeof users.$inferInsert;

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string, executor: TDbExecutor = this.database.db): Promise<TUserRow | null> {
    const [row] = await executor.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async findByEmail(
    email: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TUserRow | null> {
    const [row] = await executor.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }

  async create(values: TNewUserRow, executor: TDbExecutor = this.database.db): Promise<TUserRow> {
    const [row] = await executor.insert(users).values(values).returning();
    if (!row) {
      throw new Error("Insert into users returned no row");
    }
    return row;
  }

  async markEmailVerified(id: string, executor: TDbExecutor = this.database.db): Promise<void> {
    await executor.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, id));
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<void> {
    await executor.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.database.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }
}
