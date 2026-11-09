import type * as schema from "./schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type TDatabase = NodePgDatabase<typeof schema>;
export type TTransaction = Parameters<Parameters<TDatabase["transaction"]>[0]>[0];
export type TDbExecutor = TDatabase | TTransaction;
