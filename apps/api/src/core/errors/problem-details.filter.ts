import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";

import { Catch, Logger } from "@nestjs/common";

import { MIN_SERVER_ERROR_STATUS, ProblemDetailsHelper } from "./problem-details.helper.js";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = typeof request.id === "string" ? request.id : null;

    const problem = ProblemDetailsHelper.fromException(exception, request.originalUrl, requestId);

    if (problem.status >= MIN_SERVER_ERROR_STATUS) {
      this.logger.error({ err: exception, requestId }, "Unhandled exception");
    }

    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}
