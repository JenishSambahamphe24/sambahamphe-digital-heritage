import type { OnApplicationShutdown } from "@nestjs/common";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { AppConfig } from "../config/app-config.js";
import * as schema from "./schema/index.js";

const POOL_MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT_MS = 2_000;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly db: NodePgDatabase<typeof schema>;
  private readonly pool: pg.Pool;

  constructor(config: AppConfig) {
    this.pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: POOL_MAX_CONNECTIONS,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });
    this.db = drizzle({ client: this.pool, schema });
  }

  async ping(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
