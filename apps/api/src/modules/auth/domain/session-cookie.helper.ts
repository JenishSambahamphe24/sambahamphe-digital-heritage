import type { TAuthClient } from "../auth.types.js";
import type { CookieOptions, Response } from "express";

import { AuthClientHelper } from "./auth-client.helper.js";

const COOKIE_PATH = "/";

export class SessionCookieHelper {
  static set(
    response: Response,
    client: Exclude<TAuthClient, "mobile">,
    token: string,
    expires: Date,
    secure: boolean,
  ): void {
    response.cookie(AuthClientHelper.cookieName(client), token, {
      ...SessionCookieHelper.baseOptions(secure),
      expires,
    });
  }

  static clear(response: Response, client: Exclude<TAuthClient, "mobile">, secure: boolean): void {
    response.clearCookie(
      AuthClientHelper.cookieName(client),
      SessionCookieHelper.baseOptions(secure),
    );
  }

  private static baseOptions(secure: boolean): CookieOptions {
    return { httpOnly: true, secure, sameSite: "lax", path: COOKIE_PATH };
  }
}
