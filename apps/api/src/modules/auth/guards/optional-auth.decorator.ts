import type { IAuthContext } from "../auth.types.js";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { createParamDecorator } from "@nestjs/common";

// For @Public() routes whose answer depends on who is looking (privacy).
export const OptionalAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthContext | null =>
    context.switchToHttp().getRequest<Request>().auth ?? null,
);
