import type { IGrant } from "./access.types.js";

declare global {
  namespace Express {
    interface Request {
      grants?: IGrant[];
    }
  }
}
