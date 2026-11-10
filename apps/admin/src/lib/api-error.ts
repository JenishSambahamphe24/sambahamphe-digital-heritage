import type { TProblemDetails, TProblemFieldError } from "@repo/contracts";

// Wraps the API's problem details in a real Error, so failures keep a stack
// trace and code paths can switch on the stable `code`.
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly errors: TProblemFieldError[];
  readonly currentVersion: number | undefined;

  constructor(
    problem: Pick<TProblemDetails, "code" | "status" | "detail"> &
      Partial<Pick<TProblemDetails, "errors" | "currentVersion">>,
  ) {
    super(problem.detail);
    this.name = "ApiError";
    this.code = problem.code;
    this.status = problem.status;
    this.errors = problem.errors ?? [];
    this.currentVersion = problem.currentVersion;
  }
}
