import { HttpStatus, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { AppException } from "./app.exception.js";
import { ProblemDetailsHelper } from "./problem-details.helper.js";

const INSTANCE = "/api/v1/persons";
const REQUEST_ID = "req-1";

describe("ProblemDetailsHelper.fromException", () => {
  it("maps an AppException with its own code, title and field errors", () => {
    const exception = new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "validation_error",
      "Validation failed",
      "1 field is invalid.",
      [{ path: ["names", 0, "fullName"], code: "too_small", message: "Name is required." }],
    );

    expect(ProblemDetailsHelper.fromException(exception, INSTANCE, REQUEST_ID)).toEqual({
      type: "urn:sambahamphe:problem:validation_error",
      title: "Validation failed",
      status: 422,
      code: "validation_error",
      detail: "1 field is invalid.",
      instance: INSTANCE,
      requestId: REQUEST_ID,
      errors: [{ path: ["names", 0, "fullName"], code: "too_small", message: "Name is required." }],
    });
  });

  it("maps a Nest client error to a stable code", () => {
    const problem = ProblemDetailsHelper.fromException(
      new NotFoundException("Cannot GET /x"),
      INSTANCE,
      null,
    );

    expect(problem).toMatchObject({ status: 404, code: "not_found", detail: "Cannot GET /x" });
    expect(problem).not.toHaveProperty("errors");
  });

  it("never leaks the message of an unexpected error", () => {
    const secret = 'relation "audit_log_secret" does not exist';
    const problem = ProblemDetailsHelper.fromException(new Error(secret), INSTANCE, REQUEST_ID);

    expect(problem).toMatchObject({ status: 500, code: "internal_error" });
    expect(JSON.stringify(problem)).not.toContain("audit_log_secret");
  });

  it("treats Nest 5xx exceptions as internal errors", () => {
    const problem = ProblemDetailsHelper.fromException(
      new ServiceUnavailableException("db host 10.0.0.5 down"),
      INSTANCE,
      REQUEST_ID,
    );

    expect(problem.code).toBe("internal_error");
    expect(JSON.stringify(problem)).not.toContain("10.0.0.5");
  });
});
