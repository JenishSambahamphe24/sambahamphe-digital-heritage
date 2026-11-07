import type { IProblemDetails } from "./problem-details.types.js";

import { HttpException, HttpStatus } from "@nestjs/common";

import { AppException } from "./app.exception.js";

export const MIN_SERVER_ERROR_STATUS = 500;

const PROBLEM_TYPE_PREFIX = "urn:sambahamphe:problem:";

const CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "bad_request",
  [HttpStatus.UNAUTHORIZED]: "unauthorized",
  [HttpStatus.FORBIDDEN]: "forbidden",
  [HttpStatus.NOT_FOUND]: "not_found",
  [HttpStatus.METHOD_NOT_ALLOWED]: "method_not_allowed",
  [HttpStatus.CONFLICT]: "conflict",
  [HttpStatus.PRECONDITION_FAILED]: "precondition_failed",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "payload_too_large",
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: "unsupported_media_type",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "validation_error",
  [HttpStatus.TOO_MANY_REQUESTS]: "rate_limited",
  [HttpStatus.SERVICE_UNAVAILABLE]: "service_unavailable",
};

const TITLE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "Bad request",
  [HttpStatus.UNAUTHORIZED]: "Unauthorized",
  [HttpStatus.FORBIDDEN]: "Forbidden",
  [HttpStatus.NOT_FOUND]: "Not found",
  [HttpStatus.METHOD_NOT_ALLOWED]: "Method not allowed",
  [HttpStatus.CONFLICT]: "Conflict",
  [HttpStatus.PRECONDITION_FAILED]: "Precondition failed",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "Payload too large",
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: "Unsupported media type",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "Validation failed",
  [HttpStatus.TOO_MANY_REQUESTS]: "Too many requests",
  [HttpStatus.SERVICE_UNAVAILABLE]: "Service unavailable",
};

const INTERNAL_ERROR_CODE = "internal_error";
const INTERNAL_ERROR_TITLE = "Internal server error";
const INTERNAL_ERROR_DETAIL = "An unexpected error occurred.";
const FALLBACK_CLIENT_ERROR_CODE = "http_error";
const FALLBACK_CLIENT_ERROR_TITLE = "Request failed";

export class ProblemDetailsHelper {
  static fromException(
    exception: unknown,
    instance: string,
    requestId: string | null,
  ): IProblemDetails {
    if (exception instanceof AppException) {
      return ProblemDetailsHelper.build(exception.status, exception.code, {
        title: exception.title,
        detail: exception.detail,
        instance,
        requestId,
        errors: exception.errors,
      });
    }

    if (exception instanceof HttpException && exception.getStatus() < MIN_SERVER_ERROR_STATUS) {
      const status = exception.getStatus();
      return ProblemDetailsHelper.build(
        status,
        CODE_BY_STATUS[status] ?? FALLBACK_CLIENT_ERROR_CODE,
        {
          title: TITLE_BY_STATUS[status] ?? FALLBACK_CLIENT_ERROR_TITLE,
          detail: exception.message,
          instance,
          requestId,
        },
      );
    }

    // Anything else is a server fault: never echo its message, it may contain
    // SQL, file paths or personal data.
    return ProblemDetailsHelper.build(HttpStatus.INTERNAL_SERVER_ERROR, INTERNAL_ERROR_CODE, {
      title: INTERNAL_ERROR_TITLE,
      detail: INTERNAL_ERROR_DETAIL,
      instance,
      requestId,
    });
  }

  private static build(
    status: number,
    code: string,
    fields: Omit<IProblemDetails, "type" | "status" | "code">,
  ): IProblemDetails {
    const problem: IProblemDetails = {
      type: `${PROBLEM_TYPE_PREFIX}${code}`,
      title: fields.title,
      status,
      code,
      detail: fields.detail,
      instance: fields.instance,
      requestId: fields.requestId,
    };
    if (fields.errors?.length) {
      problem.errors = fields.errors;
    }
    return problem;
  }
}
