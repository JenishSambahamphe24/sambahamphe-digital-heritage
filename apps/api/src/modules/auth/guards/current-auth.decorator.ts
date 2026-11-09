import type { IAuthContext } from "../auth.types.js";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { createParamDecorator } from "@nestjs/common";

// Only for routes the SessionGuard protects, where `auth` is always set.
export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthContext => {
    const auth = context.switchToHttp().getRequest<Request>().auth;
    if (!auth) {
      throw new Error("CurrentAuth used on a route without an authenticated session");
    }
    return auth;
  },
);
