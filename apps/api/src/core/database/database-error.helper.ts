const UNIQUE_VIOLATION = "23505";

export class DatabaseErrorHelper {
  // Drizzle wraps driver errors; the Postgres code sits on `cause`.
  static isUniqueViolation(error: unknown): boolean {
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    return (
      typeof cause === "object" &&
      cause !== null &&
      "code" in cause &&
      cause.code === UNIQUE_VIOLATION
    );
  }
}
