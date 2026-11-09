import type { paths } from "./generated/openapi.js";
import type { Client } from "openapi-fetch";

import createClient from "openapi-fetch";

export type TApiClientKind = "web" | "admin" | "mobile";

export interface IApiClientOptions {
  // In the browser, the site's own origin ("" works too): the API is served
  // same-origin, so the session cookie travels with requests. On a server
  // (Next.js rendering, scripts) relative URLs are invalid: pass an absolute one.
  baseUrl: string;
  client: TApiClientKind;
  // Mobile only; browser apps rely on the HttpOnly cookie.
  sessionToken?: string;
  fetch?: typeof globalThis.fetch;
}

export type TApiClient = Client<paths>;

const CLIENT_HEADER = "X-Client";

export class ApiClientFactory {
  static create(options: IApiClientOptions): TApiClient {
    const headers: Record<string, string> = { [CLIENT_HEADER]: options.client };
    if (options.client === "mobile" && options.sessionToken) {
      headers.Authorization = `Bearer ${options.sessionToken}`;
    }
    return createClient<paths>({
      baseUrl: options.baseUrl,
      headers,
      credentials: options.client === "mobile" ? "omit" : "same-origin",
      fetch: options.fetch,
    });
  }
}
