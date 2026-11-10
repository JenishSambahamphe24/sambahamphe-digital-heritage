import { HttpStatus } from "@nestjs/common";

import { AppException } from "./app.exception.js";

// Someone saved a newer version first; the client reloads instead of overwriting.
export class VersionConflictException extends AppException {
  constructor(readonly currentVersion: number) {
    super(
      HttpStatus.CONFLICT,
      "version_conflict",
      "Changed by someone else",
      "This record was changed after you opened it. Reload to see the latest version.",
    );
  }
}
