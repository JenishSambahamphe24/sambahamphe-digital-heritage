import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import path from "node:path";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const POSTGRES_IMAGE = "postgres:17-alpine";
const MIGRATIONS_FOLDER = path.resolve(import.meta.dirname, "../../drizzle");

export class TestDatabase {
  private constructor(private readonly container: StartedPostgreSqlContainer) {}

  static async start(): Promise<TestDatabase> {
    const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
    const database = new TestDatabase(container);
    await database.migrate();
    return database;
  }

  get url(): string {
    return this.container.getConnectionUri();
  }

  async query<TRow extends pg.QueryResultRow>(text: string): Promise<TRow[]> {
    const client = new pg.Client({ connectionString: this.url });
    await client.connect();
    try {
      return (await client.query<TRow>(text)).rows;
    } finally {
      await client.end();
    }
  }

  async stop(): Promise<void> {
    await this.container.stop();
  }

  private async migrate(): Promise<void> {
    const pool = new pg.Pool({ connectionString: this.url });
    try {
      await migrate(drizzle({ client: pool }), { migrationsFolder: MIGRATIONS_FOLDER });
    } finally {
      await pool.end();
    }
  }
}
