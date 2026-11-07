import type { IProblemFieldError } from "./problem-details.types.js";

export class AppException extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly title: string,
    readonly detail: string = title,
    readonly errors?: IProblemFieldError[],
  ) {
    super(detail);
    this.name = "AppException";
  }
}
