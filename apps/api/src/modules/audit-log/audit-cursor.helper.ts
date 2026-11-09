export class AuditCursorHelper {
  static encode(id: number): string {
    return Buffer.from(String(id)).toString("base64url");
  }

  static decode(cursor: string | undefined): number | null {
    if (!cursor) {
      return null;
    }
    const id = Number(Buffer.from(cursor, "base64url").toString());
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }
}
