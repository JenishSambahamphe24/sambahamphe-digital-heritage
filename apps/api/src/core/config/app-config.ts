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

  get logLevel(): TEnv["LOG_LEVEL"] {
    return this.env.LOG_LEVEL;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get smtpUrl(): string {
    return this.env.SMTP_URL;
  }

  get mailFrom(): string {
    return this.env.MAIL_FROM;
  }

  get publicWebUrl(): string {
    return this.env.PUBLIC_WEB_URL;
  }

  get adminWebUrl(): string {
    return this.env.ADMIN_WEB_URL;
  }

  get allowedOrigins(): string[] {
    return [new URL(this.env.PUBLIC_WEB_URL).origin, new URL(this.env.ADMIN_WEB_URL).origin];
  }

  get cookieSecure(): boolean {
    return this.env.COOKIE_SECURE;
  }

  get trustProxyHops(): number {
    return this.env.TRUST_PROXY_HOPS;
  }

  get ipHashSecret(): string {
    return this.env.IP_HASH_SECRET;
  }
}
