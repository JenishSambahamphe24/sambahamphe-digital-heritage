import type { TProblemDetails } from "@repo/contracts";

// Wraps the API's problem details in a real Error, so failures keep a stack
// trace and code paths can switch on the stable `code`.
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(problem: Pick<TProblemDetails, "code" | "status" | "detail">) {
    super(problem.detail);
    this.name = "ApiError";
    this.code = problem.code;
    this.status = problem.status;
  }
}
