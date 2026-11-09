import { createHash, randomBytes } from "node:crypto";

import { SESSION_TOKEN_BYTES } from "../auth.constants.js";

export class TokenHelper {
  static generate(): string {
    return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
  }

  // A fast hash is enough: tokens carry 256 bits of randomness, so there is
  // nothing to brute-force the way a human password can be.
  static hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
