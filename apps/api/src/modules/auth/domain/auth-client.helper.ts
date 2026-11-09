import type { TAuthClient } from "../auth.types.js";
import type { Request } from "express";

import { CLIENT_HEADER, SESSION_COOKIE } from "../auth.constants.js";

const BEARER_PREFIX = "Bearer ";
const CLIENTS: readonly TAuthClient[] = ["web", "admin", "mobile"];

export class AuthClientHelper {
  // The admin and web Next.js apps set this header in their /api proxy.
  // Spoofing it gains nothing: it only picks which cookie name to read.
  static fromRequest(request: Request): TAuthClient {
    const header = request.headers[CLIENT_HEADER];
    return CLIENTS.find((client) => client === header) ?? "web";
  }

  static sessionToken(request: Request, client: TAuthClient): string | null {
    if (client === "mobile") {
      const authorization = request.headers.authorization;
      return authorization?.startsWith(BEARER_PREFIX)
        ? authorization.slice(BEARER_PREFIX.length) || null
        : null;
    }
    const cookies = request.cookies as Record<string, string | undefined>;
    return cookies[SESSION_COOKIE[client]] ?? null;
  }

  static cookieName(client: Exclude<TAuthClient, "mobile">): string {
    return SESSION_COOKIE[client];
  }
}
