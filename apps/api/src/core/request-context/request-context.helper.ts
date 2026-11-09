import type { Request } from "express";

import { AsyncLocalStorage } from "node:async_hooks";

interface IRequestStore {
  request: Request;
}

const storage = new AsyncLocalStorage<IRequestStore>();

export class RequestContextHelper {
  static run(request: Request, callback: () => void): void {
    storage.run({ request }, callback);
  }

  static currentRequest(): Request | null {
    return storage.getStore()?.request ?? null;
  }
}
