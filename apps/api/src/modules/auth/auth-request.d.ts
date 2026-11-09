import type { IAuthContext } from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: IAuthContext;
    }
  }
}
