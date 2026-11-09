import { createHmac } from "node:crypto";

export class IpHashHelper {
  static hash(ip: string | undefined, secret: string): string | null {
    if (!ip) {
      return null;
    }
    return createHmac("sha256", secret).update(ip).digest("hex");
  }
}
