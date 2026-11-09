import type { IncomingMessage, ServerResponse } from "node:http";

import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

const MAX_REQUEST_ID_LENGTH = 128;
// Caller-supplied ids end up in logs; restrict them so a client can't inject
// log lines or oversized values.
const SAFE_REQUEST_ID = /^[\w.-]+$/;

export class RequestIdHelper {
  static assign(request: IncomingMessage, response: ServerResponse): string {
    const incoming = request.headers[REQUEST_ID_HEADER];
    const id =
      typeof incoming === "string" &&
      incoming.length <= MAX_REQUEST_ID_LENGTH &&
      SAFE_REQUEST_ID.test(incoming)
        ? incoming
        : randomUUID();
    response.setHeader(REQUEST_ID_HEADER, id);
    return id;
  }
}
