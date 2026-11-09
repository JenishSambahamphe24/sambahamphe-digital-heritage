import type { IProblemFieldError } from "../errors/problem-details.types.js";
import type { StandardSchemaValidationPipeOptions } from "@nestjs/common";

import { HttpStatus } from "@nestjs/common";

import { AppException } from "../errors/app.exception.js";

type TIssue = Parameters<
  NonNullable<StandardSchemaValidationPipeOptions["exceptionFactory"]>
>[0][number];
type TPathSegment = NonNullable<TIssue["path"]>[number];

const VALIDATION_ERROR_CODE = "validation_error";
const INVALID_FIELD_CODE = "invalid";

export class ValidationExceptionHelper {
  static fromIssues(issues: readonly TIssue[]): AppException {
    const errors: IProblemFieldError[] = issues.map((issue) => ({
      path: (issue.path ?? []).map((segment) => ValidationExceptionHelper.segmentKey(segment)),
      code: INVALID_FIELD_CODE,
      message: issue.message,
    }));
    const detail =
      errors.length === 1 ? "1 field is invalid." : `${errors.length} fields are invalid.`;
    return new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      VALIDATION_ERROR_CODE,
      "Validation failed",
      detail,
      errors,
    );
  }

  private static segmentKey(segment: TPathSegment): string | number {
    const key = typeof segment === "object" ? segment.key : segment;
    return typeof key === "number" ? key : String(key);
  }
}
