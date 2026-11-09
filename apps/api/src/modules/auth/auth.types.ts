import type { TUserRow } from "../users/users.repository.js";

export type TAuthClient = "web" | "admin" | "mobile";

export interface ISessionRow {
  id: string;
  userId: string;
  client: TAuthClient;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface IAuthContext {
  user: TUserRow;
  session: ISessionRow;
  client: TAuthClient;
}

export interface IRequestMeta {
  userAgent: string | null;
  ip: string | undefined;
}
