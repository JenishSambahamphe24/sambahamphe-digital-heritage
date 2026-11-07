import type { TEnv } from "./env.schema.js";

export class AppConfig {
  constructor(private readonly env: TEnv) {}

  get nodeEnv(): TEnv["NODE_ENV"] {
    return this.env.NODE_ENV;
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === "development";
  }

  get port(): number {
    return this.env.PORT;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get logLevel(): TEnv["LOG_LEVEL"] {
    return this.env.LOG_LEVEL;
  }
}
