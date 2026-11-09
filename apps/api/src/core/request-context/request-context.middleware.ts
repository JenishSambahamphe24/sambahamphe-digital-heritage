import type { NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

import { Injectable } from "@nestjs/common";

import { RequestContextHelper } from "./request-context.helper.js";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    RequestContextHelper.run(request, next);
  }
}
