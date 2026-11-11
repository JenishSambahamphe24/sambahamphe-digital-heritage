const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const EXCLUSION_VIOLATION = "23P01";

interface IPgError {
  code?: string;
  constraint?: string;
}

export class DatabaseErrorHelper {
  static isUniqueViolation(error: unknown): boolean {
    return DatabaseErrorHelper.cause(error)?.code === UNIQUE_VIOLATION;
  }

  static isForeignKeyViolation(error: unknown): boolean {
    return DatabaseErrorHelper.cause(error)?.code === FOREIGN_KEY_VIOLATION;
  }

  // An exclusion constraint (overlapping terms, a second chairperson) by name.
  static isExclusionViolation(error: unknown, constraint: string): boolean {
    const cause = DatabaseErrorHelper.cause(error);
    return cause?.code === EXCLUSION_VIOLATION && cause.constraint === constraint;
  }

  static constraintOf(error: unknown): string | undefined {
    return DatabaseErrorHelper.cause(error)?.constraint;
  }

  // Drizzle wraps driver errors; the Postgres code sits on `cause`.
  private static cause(error: unknown): IPgError | null {
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    return typeof cause === "object" && cause !== null ? cause : null;
  }
}
